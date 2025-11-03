const Content = require('../models/content');

async function fetchOmdbData(title, year) {
  const apiKey = process.env.OMDB_API_KEY;
  console.log('🔍 Fetching OMDb data for:', title, year, 'with key:', apiKey ? 'SET' : 'NOT SET');
  if (!apiKey) return null;
  const params = new URLSearchParams({
    t: title,
    y: year ? String(year) : '',
    apikey: apiKey
  });
  const url = `https://www.omdbapi.com/?${params.toString()}`;

  const res = await fetch(url);
  console.log('📡 OMDb response status:', res.status);
  if (!res.ok) return null;
  const data = await res.json();
  console.log('📊 OMDb data:', JSON.stringify(data, null, 2));
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

  console.log('🎯 Parsed ratings:', { imdb, rottenTomatoes: rotten });
  return { imdb, rottenTomatoes: rotten };
}

async function fetchOmdbEpisodeData(seriesTitle, seasonNumber, episodeNumber) {
  const apiKey = process.env.OMDB_API_KEY;
  console.log('🔍 Fetching OMDb EP data for:', { seriesTitle, seasonNumber, episodeNumber });
  if (!apiKey) return null;
  const params = new URLSearchParams({
    t: seriesTitle,
    Season: String(seasonNumber),
    Episode: String(episodeNumber),
    apikey: apiKey
  });
  const url = `https://www.omdbapi.com/?${params.toString()}`;
  const res = await fetch(url);
  console.log('📡 OMDb EP response status:', res.status);
  if (!res.ok) return null;
  const data = await res.json();
  console.log('📊 OMDb EP data:', JSON.stringify(data, null, 2));
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
    console.log('🎬 Enriching movie:', contentDoc.title, contentDoc.year);
    const ratings = await fetchOmdbData(contentDoc.title, contentDoc.year);
    if (!ratings) {
      console.log('❌ No ratings data returned');
      return contentDoc;
    }

    const update = {};
    if (ratings.imdb != null) update['ratings.imdb'] = ratings.imdb;
    if (ratings.rottenTomatoes != null) update['ratings.rottenTomatoes'] = ratings.rottenTomatoes;
    if (Object.keys(update).length === 0) {
      console.log('❌ No valid ratings to update');
      return contentDoc;
    }

    console.log('💾 Updating with:', update);
    const updated = await Content.findByIdAndUpdate(contentDoc.id, { $set: update }, { new: true });
    console.log('✅ Updated movie:', updated ? 'SUCCESS' : 'FAILED');
    return updated || contentDoc;
  } catch (err) {
    console.log('❌ Error enriching movie:', err.message);
    return contentDoc;
  }
}

module.exports = { enrichMovieRatings };

// Enrich a series (top-level Content with type 'series') using OMDb by title/year
async function enrichSeriesRatings(seriesDoc) {
  if (!seriesDoc || seriesDoc.type !== 'series') return seriesDoc;
  try {
    console.log('📺 Enriching series:', seriesDoc.title, seriesDoc.year);
    const ratings = await fetchOmdbData(seriesDoc.title, seriesDoc.year);
    if (!ratings) return seriesDoc;
    const update = {};
    if (ratings.imdb != null) update['ratings.imdb'] = ratings.imdb;
    if (ratings.rottenTomatoes != null) update['ratings.rottenTomatoes'] = ratings.rottenTomatoes;
    if (Object.keys(update).length === 0) return seriesDoc;
    const updated = await Content.findByIdAndUpdate(seriesDoc.id, { $set: update }, { new: true });
    return updated || seriesDoc;
  } catch (err) {
    console.log('❌ Error enriching series:', err.message);
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
    console.log('❌ Error enriching episodes:', err.message);
    return null;
  }
}

module.exports.enrichSeriesRatings = enrichSeriesRatings;
module.exports.enrichSeriesEpisodesRatings = enrichSeriesEpisodesRatings;
