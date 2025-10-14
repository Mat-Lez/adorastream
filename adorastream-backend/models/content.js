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

const EpisodeSchema = new Schema(
  {
    season: { type: Number, min: 1 },
    episode: { type: Number, min: 1 },
    title: { type: String, trim: true },
    durationSec: { type: Number, min: 0, default: 0 }
  },
  { _id: false }
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
    episodes: { type: [EpisodeSchema], default: [] }
  },
  { timestamps: true }
);

// search index
ContentSchema.index({ title: 'text' });
ContentSchema.plugin(cleanMongoResponse);
module.exports = model('Content', ContentSchema);