const { Schema, model, Types } = require('mongoose');
const cleanMongoResponse = require('../utils/responseHelper');

const WatchHistorySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
    profileId: { type: Types.ObjectId, required: true }, // subdoc _id from User.profiles
    contentId: { type: Types.ObjectId, ref: 'Content', index: true, required: true },

    episodeId: { type: Types.ObjectId, default: null },   // for series. subdoc _id from Content.seriesEpisode


    lastPositionSec: { type: Number, min: 0, default: 0 },
    completed: { type: Boolean, default: false },
    liked: { type: Boolean, default: false },

    // Adding a psuedo record 'series_like' to store series likes
    // progress type will be for movies and episodes normal progress
    type: { type: String, enum: ['progress', 'series_like'], default: 'progress' },

    lastWatchedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

WatchHistorySchema.index(
  { userId: 1, profileId: 1, contentId: 1, episodeId: 1 },
  { unique: true, name: 'uniq_user_profile_content' }
);
WatchHistorySchema.plugin(cleanMongoResponse);
module.exports = model('WatchHistory', WatchHistorySchema);