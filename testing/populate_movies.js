const mongoose = require('mongoose');
const Content = require('../adorastream-backend/models/content');

const MONGODB_URI = process.env.MONGODB_URI
const sampleMovies = [
  // { title: 'Parasite', year: 2019, genres: ['Drama', 'Thriller'] },
  // { title: 'The Terminator', year: 1984, genres: ['Action', 'Sci-Fi'] },
  // { title: 'Inception', year: 2010, genres: ['Sci-Fi', 'Thriller'] },
  // { title: 'The Matrix', year: 1999, genres: ['Sci-Fi', 'Action'] },
  // { title: 'Pulp Fiction', year: 1994, genres: ['Crime', 'Drama'] },
  // { title: 'The Godfather', year: 1972, genres: ['Crime', 'Drama'] },
  // { title: 'Fight Club', year: 1999, genres: ['Drama'] },
  // { title: 'Interstellar', year: 2014, genres: ['Sci-Fi', 'Drama'] },
  // { title: 'The Shawshank Redemption', year: 1994, genres: ['Drama'] },
  {
    title: 'The Dark Knight',
    year: 2008,
    genres: ['Action', 'Crime'],
    posterUrl: '/assets/posters/TheDarkKnight.webp',
    videoUrl: '/assets/videos/TheDarkKnight(2008).mp4'
  },
  // {
  //   title: 'Forrest Gump',
  //   year: 1994,
  //   genres: ['Drama', 'Romance'],
  //   posterUrl: '/assets/posters/ForrestGump.webp',
  //   videoUrl: '/assets/videos/ForrestGump.mp4'
  // },
  // {
  //   title: 'Mad Max: Fury Road',
  //   year: 2015,
  //   genres: ['Action', 'Adventure'],
  //   posterUrl: '/assets/posters/MadMaxFuryRoad.webp',
  //   videoUrl: '/assets/videos/MadMax_FuryRoad.mp4'
  // },
  // {
  //   title: 'Die Hard',
  //   year: 1988,
  //   genres: ['Action', 'Thriller'],
  //   posterUrl: '/assets/posters/DieHard.webp',
  //   videoUrl: '/assets/videos/DieHard.mp4'
  // },
  // {
  //   title: 'John Wick',
  //   year: 2014,
  //   genres: ['Action', 'Crime'],
  //   posterUrl: '/assets/posters/JohnWick.jpg',
  //   videoUrl: '/assets/videos/JohnWick(2014).mp4'
  // },
  // {
  //   title: 'Gladiator',
  //   year: 2000,
  //   genres: ['Action', 'Drama'],
  //   posterUrl: '/assets/posters/Gladiator.jpg',
  //   videoUrl: '/assets/videos/GLADIATOR.mp4'
  // },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB', MONGODB_URI);

  for (const m of sampleMovies) {
    const exists = await Content.findOne({ title: m.title, type: 'movie' });
    // if (exists) {
    //   console.log('Skipping existing:', m.title);
    //   continue;
    // }

    const doc = {
      type: 'movie',
      title: m.title,
      year: m.year,
      genres: m.genres,
      director: m.director || '',
      synopsis: m.synopsis || '',
      posterUrl: m.posterUrl || '/adorastream.png',
      videoUrl: m.videoUrl || ''
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
