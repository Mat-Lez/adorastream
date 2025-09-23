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


