const watchHistory = require('../models/watchHistory');
const Content = require('../models/content');

const DEFAULT_RECOMMENDATIONS_LIMIT = Number(process.env.DEFAULT_RECOMMENDATIONS_LIMIT) || 20;

exports.watchedContentByGenreByProfileID = async (req, res) => {
    let { days } = req.query;
    if (!days) {
        days = 7; // One week backwards
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - Number(days));
    
    if (!req?.session?.user?.id) {
        return res.status(401).json({ message: 'Not authenticated' });
    } else if (!req?.session?.user?.profileId) {
        return res.status(403).json({ message: 'No profile selected' });
    }

    const userId = req.session.user.id;
    const profileId = req.session.user.profileId;

    try {
        const histories = await watchHistory.find({
            userId: userId,
            profileId: profileId,
            lastWatchedAt: { $gte: fromDate }
        })
        // Populate 'contentId' and only select the genres field from it
        .populate('contentId', 'genres'); 

        if (histories.length === 0) {
            return res.json([]);
        }

        const genreCounts = {};

        for (const history of histories) {
            if (history.contentId && Array.isArray(history.contentId.genres)) {
                for (const genre of history.contentId.genres) {
                    // Add 1 to the count for this genre
                    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                }
            }
        }

        // Convert the counts object into the array format the chart expects
        // from: { "Action": 3, "Drama": 3, "Fantasy": 3 }
        // to: [ { genre: "Action", watchedCount: 3 }, ... ]
        const data = Object.keys(genreCounts).map(genre => ({
            genre: genre,
            watchedCount: genreCounts[genre]
        }));

        // Sort the final result
        data.sort((a, b) => b.watchedCount - a.watchedCount);

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generating weekly genre stats' });
    }
};

/**
 * A reusable helper to get a user's top genres based on a filter.
 * @param {string} userId - The user's ID
 * @param {string} profileId - The profile's ID
 * @param {object} filter - A Mongoose filter object (e.g., { liked: true })
 * @returns {Promise<Array<string>>} A promise that resolves to an array of top genre strings
 */
async function getTopGenresByFilter(userId, profileId, filter) {
    try {
        const histories = await watchHistory.find({
            userId: userId,
            profileId: profileId,
            ...filter
        }).populate('contentId', 'genres');

        if (histories.length === 0) {
            return [];
        }

        const genreCounts = {};
        for (const history of histories) {
            if (history.contentId && Array.isArray(history.contentId.genres)) {
                for (const genre of history.contentId.genres) {
                    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                }
            }
        }

        // Sort the genres by count, descending
        const sortedGenres = Object.keys(genreCounts).sort((a, b) => {
            return genreCounts[b] - genreCounts[a];
        });

        // Return the top 3 genre names
        return sortedGenres.slice(0, 3); // e.g., ["Action", "Drama", "Fantasy"]

    } catch (error) {
        console.error("Error in getTopGenresByFilter:", error);
        return [];
    }
}

/**
 * Gets recommended content for the active profile.
 * @param {string} userId - The user's ID
 * @param {string} profileId - The profile's ID
 * @returns {Promise<Array>} A promise that resolves to a list of recommendations
 */
async function getRecommendedContent(userId, profileId) {
    try {
        // Try to get top 3 genres from "liked" content
        let topGenres = await getTopGenresByFilter(userId, profileId, { liked: true });

        // Fallback: If no liked content, get top 3 from *all* watch history
        if (topGenres.length === 0) {
            topGenres = await getTopGenresByFilter(userId, profileId, {});
        }

        // Get a list of all content this profile has *already* interacted with
        const watchedContentIds = await watchHistory.find({
            userId: userId,
            profileId: profileId
        }).distinct('contentId');

        let recommendations;

        const query = {
            _id: { $nin: watchedContentIds } // Excludes watched content
        };
        if (topGenres.length > 0) {
            query.genres = { $in: topGenres };
        }

        recommendations = await Content.find(query)
            .select('title posterUrl')
            .limit(DEFAULT_RECOMMENDATIONS_LIMIT) // Limit to a reasonable number
            .sort({ createdAt: -1 }); // Sort by newest

        return recommendations;

    } catch (error) {
        console.error("Error in getRecommendedContent:", error);
        return [];
    }
}

exports.getRecommendedContent = getRecommendedContent;
