const Content = require('../models/content');

async function fetchOmdbData(title, year) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return null;
  const params = new URLSearchParams({
    t: title,
    y: year ? String(year) : '',
    apikey: apiKey
  });
  const url = `https://www.omdbapi.com/?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.Response === 'False') return null;

  let imdb = null;
  if (data.imdbRating && !isNaN(Number(data.imdbRating))) {
    const n = Number(data.imdbRating);
    imdb = n >= 0 && n <= 10 ? n : null;
  }

  let rotten = null;
  if (Array.isArray(data.Ratings)) {
    const rt = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
    if (rt && typeof rt.Value === 'string' && rt.Value.endsWith('%')) {
      const pct = Number(rt.Value.replace('%', ''));
      if (!isNaN(pct) && pct >= 0 && pct <= 100) rotten = pct;
    }
  }
<<<<<<< HEAD
  return { imdb, rottenTomatoes: rotten };
}

async function fetchOmdbEpisodeData(seriesTitle, seasonNumber, episodeNumber) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return null;
  const params = new URLSearchParams({
    t: seriesTitle,
    Season: String(seasonNumber),
    Episode: String(episodeNumber),
    apikey: apiKey
  });
  const url = `https://www.omdbapi.com/?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.Response === 'False') return null;

  let imdb = null;
  if (data.imdbRating && !isNaN(Number(data.imdbRating))) {
    const n = Number(data.imdbRating);
    imdb = n >= 0 && n <= 10 ? n : null;
  }
  let rotten = null;
  if (Array.isArray(data.Ratings)) {
    const rt = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
    if (rt && typeof rt.Value === 'string' && rt.Value.endsWith('%')) {
      const pct = Number(rt.Value.replace('%', ''));
      if (!isNaN(pct) && pct >= 0 && pct <= 100) rotten = pct;
    }
  }
=======
>>>>>>> 77a4c55 (fix gemini code review issues)
  return { imdb, rottenTomatoes: rotten };
}

async function fetchOmdbEpisodeData(seriesTitle, seasonNumber, episodeNumber) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return null;
  const params = new URLSearchParams({
    t: seriesTitle,
    Season: String(seasonNumber),
    Episode: String(episodeNumber),
    apikey: apiKey
  });
  const url = `https://www.omdbapi.com/?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.Response === 'False') return null;

  let imdb = null;
  if (data.imdbRating && !isNaN(Number(data.imdbRating))) {
    const n = Number(data.imdbRating);
    imdb = n >= 0 && n <= 10 ? n : null;
  }
  let rotten = null;
  if (Array.isArray(data.Ratings)) {
    const rt = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
    if (rt && typeof rt.Value === 'string' && rt.Value.endsWith('%')) {
      const pct = Number(rt.Value.replace('%', ''));
      if (!isNaN(pct) && pct >= 0 && pct <= 100) rotten = pct;
    }
  }
  return { imdb, rottenTomatoes: rotten };
}

async function enrichMovieRatings(contentDoc) {
  if (!contentDoc || contentDoc.type !== 'movie') return contentDoc;
  try {
    const ratings = await fetchOmdbData(contentDoc.title, contentDoc.year);
    if (!ratings) return contentDoc;

    const update = {};
    if (ratings.imdb != null) update['ratings.imdb'] = ratings.imdb;
    if (ratings.rottenTomatoes != null) update['ratings.rottenTomatoes'] = ratings.rottenTomatoes;
    if (Object.keys(update).length === 0) return contentDoc;

    const updated = await Content.findByIdAndUpdate(contentDoc.id, { $set: update }, { new: true });
    return updated || contentDoc;
  } catch (err) {
    // swallow enrichment errors
    return contentDoc;
  }
}

<<<<<<< HEAD
// Enrich a series (top-level Content with type 'series') using OMDb by title/year
async function enrichSeriesRatings(seriesDoc) {
  if (!seriesDoc || seriesDoc.type !== 'series') return seriesDoc;
  try {
    const ratings = await fetchOmdbData(seriesDoc.title, seriesDoc.year);
    if (!ratings) return seriesDoc;
    const update = {};
    if (ratings.imdb != null) update['ratings.imdb'] = ratings.imdb;
    if (ratings.rottenTomatoes != null) update['ratings.rottenTomatoes'] = ratings.rottenTomatoes;
    if (Object.keys(update).length === 0) return seriesDoc;
    const updated = await Content.findByIdAndUpdate(seriesDoc.id, { $set: update }, { new: true });
    return updated || seriesDoc;
  } catch (err) {
    // swallow enrichment errors
    return seriesDoc;
  }
}

=======
>>>>>>> 77a4c55 (fix gemini code review issues)
// Enrich a series (top-level Content with type 'series') using OMDb by title/year
async function enrichSeriesRatings(seriesDoc) {
  if (!seriesDoc || seriesDoc.type !== 'series') return seriesDoc;
  try {
    const ratings = await fetchOmdbData(seriesDoc.title, seriesDoc.year);
    if (!ratings) return seriesDoc;
    const update = {};
    if (ratings.imdb != null) update['ratings.imdb'] = ratings.imdb;
    if (ratings.rottenTomatoes != null) update['ratings.rottenTomatoes'] = ratings.rottenTomatoes;
    if (Object.keys(update).length === 0) return seriesDoc;
    const updated = await Content.findByIdAndUpdate(seriesDoc.id, { $set: update }, { new: true });
    return updated || seriesDoc;
  } catch (err) {
    // swallow enrichment errors
    return seriesDoc;
  }
}

// Enrich ratings for a set of embedded episodes identified by season/episode numbers
async function enrichSeriesEpisodesRatings(seriesId, episodesToUpdate) {
  try {
    const series = await Content.findById(seriesId);
    if (!series || series.type !== 'series') return null;
    if (!Array.isArray(series.seasons)) return series;
    for (const spec of episodesToUpdate) {
      const { seasonNumber, episodeNumber } = spec;
      const ratings = await fetchOmdbEpisodeData(series.title, seasonNumber, episodeNumber);
      if (!ratings) continue;
      const season = series.seasons.find(s => s.seasonNumber === Number(seasonNumber));
      if (!season || !Array.isArray(season.episodes)) continue;
      const ep = season.episodes.find(e => e.episodeNumber === Number(episodeNumber));
      if (!ep) continue;
      ep.ratings = ep.ratings || {};
      if (ratings.imdb != null) ep.ratings.imdb = ratings.imdb;
      if (ratings.rottenTomatoes != null) ep.ratings.rottenTomatoes = ratings.rottenTomatoes;
    }
    await series.save();
    return series;
  } catch (err) {
    // swallow enrichment errors
<<<<<<< HEAD

=======
>>>>>>> 77a4c55 (fix gemini code review issues)
    return null;
  }
}

module.exports = {
  enrichMovieRatings,
  enrichSeriesRatings,
  enrichSeriesEpisodesRatings
};
<<<<<<< HEAD

=======
>>>>>>> 77a4c55 (fix gemini code review issues)
