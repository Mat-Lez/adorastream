const mongoose = require('mongoose');
const Content = require('../adorastream-backend/models/content');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/streaming_app';

const sampleMovies = [
  { title: 'Parasite', year: 2019, genres: ['Drama', 'Thriller'] },
  { title: 'The Terminator', year: 1984, genres: ['Action', 'Sci-Fi'] },
  { title: 'Inception', year: 2010, genres: ['Sci-Fi', 'Thriller'] },
  { title: 'The Matrix', year: 1999, genres: ['Sci-Fi', 'Action'] },
  { title: 'Pulp Fiction', year: 1994, genres: ['Crime', 'Drama'] },
  { title: 'The Godfather', year: 1972, genres: ['Crime', 'Drama'] },
  { title: 'Fight Club', year: 1999, genres: ['Drama'] },
  { title: 'Interstellar', year: 2014, genres: ['Sci-Fi', 'Drama'] },
  { title: 'The Shawshank Redemption', year: 1994, genres: ['Drama'] },
  { title: 'The Dark Knight', year: 2008, genres: ['Action', 'Crime'] },
  { title: 'Forrest Gump', year: 1994, genres: ['Drama', 'Romance'] },
  { title: 'The Prestige', year: 2006, genres: ['Drama', 'Mystery'] },
  { title: 'Gladiator', year: 2000, genres: ['Action', 'Drama'] },
  { title: 'Whiplash', year: 2014, genres: ['Drama', 'Music'] },
  { title: 'Mad Max: Fury Road', year: 2015, genres: ['Action', 'Adventure'] },
  { title: 'The Social Network', year: 2010, genres: ['Drama'] },
  { title: 'La La Land', year: 2016, genres: ['Comedy', 'Romance'] },
  { title: 'Moonlight', year: 2016, genres: ['Drama'] },
  { title: 'Arrival', year: 2016, genres: ['Sci-Fi', 'Drama'] },
  { title: 'Her', year: 2013, genres: ['Romance', 'Sci-Fi'] }
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB', MONGODB_URI);

  for (const m of sampleMovies) {
    const exists = await Content.findOne({ title: m.title, type: 'movie' });
    if (exists) {
      console.log('Skipping existing:', m.title);
      continue;
    }

    const doc = {
      type: 'movie',
      title: m.title,
      year: m.year,
      genres: m.genres,
      director: m.director || '',
      synopsis: m.synopsis || '',
      posterUrl: '/adorastream.png'
    };

    await Content.create(doc);
    console.log('Created:', m.title);
  }

  console.log('Done populating movies.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
