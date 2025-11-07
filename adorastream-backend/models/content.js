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

// Embedded episode structure for series seasons
const SeriesEpisodeSchema = new Schema(
  {
    seasonNumber: { type: Number, min: 1, required: true },
    episodeNumber: { type: Number, min: 1, required: true },
    title: { type: String, required: true, trim: true },
    synopsis: { type: String, default: '' },
    director: { type: String, default: '' },
    actors: { type: [ActorSchema], default: [] },
    posterUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    durationSec: { type: Number, min: 0, default: 0 },
    nextEpisode: { type: Schema.Types.ObjectId, default: null },
    ratings: {
      imdb: { type: Number, min: 0, max: 10, default: null },
      rottenTomatoes: { type: Number, min: 0, max: 100, default: null }
    }
  },
  { _id: true }
);

// Season with list of episodes
const SeasonSchema = new Schema(
  {
    seasonNumber: { type: Number, min: 1, required: true },
    episodes: { type: [SeriesEpisodeSchema], default: [] }
  },
  { _id: true }
);

const ContentSchema = new Schema(
  {
    type: { type: String, enum: ['movie', 'series'], required: true },
    title: { type: String, required: true, trim: true },
    synopsis: { type: String, default: '' },
    year: { type: Number, min: 1878, max: 2025 },
    genres: { type: [String], index: true, default: [] },
    director: { type: String, default: '' },
    actors: { type: [ActorSchema], default: [] },
    posterUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    ratings: {
      imdb: { type: Number, min: 0, max: 10, default: null },
      rottenTomatoes: { type: Number, min: 0, max: 100, default: null }
    },
    // Series-only fields
    creators: { type: [String], default: [] },
    numberOfSeasons: { type: Number, min: 0, default: 0 },
    seasons: { type: [SeasonSchema], default: [] }
  },
  { timestamps: true }
);

// search index
ContentSchema.index({ title: 'text' });
ContentSchema.plugin(cleanMongoResponse);
module.exports = model('Content', ContentSchema);