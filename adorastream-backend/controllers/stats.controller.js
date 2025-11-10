const watchHistory = require('../models/watchHistory');

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