const { Schema, model } = require('mongoose');
const cleanMongoResponse = require('../utils/responseHelper');

const ActorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    wikipedia: { type: String, default: '' }
  },
  { _id: false }
);

// Base Content for movies and episodes (shared content)
const baseOptions = {
  timestamps: true,
  discriminatorKey: 'type'
};

const ContentSchema = new Schema(
  {
    type: { type: String, enum: ['movie', 'episode'], required: true },
    title: { type: String, required: true, trim: true },
    synopsis: { type: String, default: '' },
    year: { type: Number, min: 1878, max: 2025 },
    genres: { type: [String], index: true, default: [] },
    director: { type: String, default: '' },
    actors: { type: [ActorSchema], default: [] },
    // Store relative paths to backend public assets
    posterUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    ratings: {
      imdb: { type: Number, min: 0, max: 10, default: null },
      rottenTomatoes: { type: Number, min: 0, max: 100, default: null }
    }
  },
  baseOptions
);

// search index
ContentSchema.index({ title: 'text' });
ContentSchema.plugin(cleanMongoResponse);

const Content = model('Content', ContentSchema);

// Movie discriminator (no extra fields beyond base)
const Movie = Content.discriminator('movie', new Schema({}, baseOptions));

// Season schema (contains episodes)
const SeasonSchema = new Schema(
  {
    seasonNumber: { type: Number, min: 1, required: true },
    title: { type: String, trim: true, default: '' },
    synopsis: { type: String, default: '' },
    year: { type: Number, min: 1878, max: 2025 },
    episodes: [{ type: Schema.Types.ObjectId, ref: 'Content' }]
  },
  { _id: true }
);

// Series schema (separate from Content, acts as container)
const SeriesSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    synopsis: { type: String, default: '' },
    yearStart: { type: Number, min: 1878, max: 2025 },
    yearEnd: { type: Number, min: 1878, max: 2025 },
    genres: { type: [String], index: true, default: [] },
    // Store relative paths to backend public assets
    posterUrl: { type: String, default: '' },
    ratings: {
      imdb: { type: Number, min: 0, max: 10, default: null },
      rottenTomatoes: { type: Number, min: 0, max: 100, default: null }
    },
    totalSeasons: { type: Number, min: 0, default: 0 },
    totalEpisodes: { type: Number, min: 0, default: 0 },
    seasons: [SeasonSchema]
  },
  { timestamps: true }
);

// search index
SeriesSchema.index({ title: 'text' });
SeriesSchema.plugin(cleanMongoResponse);

const Series = model('Series', SeriesSchema);

// Episode discriminator with ordering and linkage
const Episode = Content.discriminator(
  'episode',
  new Schema(
    {
      seriesId: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
      seasonNumber: { type: Number, min: 1, required: true },
      episodeNumber: { type: Number, min: 1, required: true },
      nextEpisodeId: { type: Schema.Types.ObjectId, ref: 'Content', default: null }
    },
    baseOptions
  )
);

// Ensure unique ordering per series
Episode.schema.index({ seriesId: 1, seasonNumber: 1, episodeNumber: 1 }, { unique: true });

module.exports = Content;
module.exports.Movie = Movie;
module.exports.Series = Series;
module.exports.Episode = Episode;