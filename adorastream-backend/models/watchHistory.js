const { Schema, model, Types } = require('mongoose');
const cleanMongoResponse = require('../utils/responseHelper');

const WatchHistorySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
    profileId: { type: Types.ObjectId, required: true }, // subdoc _id from User.profiles
    contentId: { type: Types.ObjectId, ref: 'Content', index: true, required: true },

    season: { type: Number, default: null },   // for series
    episode: { type: Number, default: null },

    lastPositionSec: { type: Number, min: 0, default: 0 },
    completed: { type: Boolean, default: false },
    liked: { type: Boolean, default: false },

    lastWatchedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

WatchHistorySchema.index(
  { userId: 1, profileId: 1, contentId: 1 },
  { unique: true, name: 'uniq_user_profile_content' }
);
WatchHistorySchema.plugin(cleanMongoResponse);
module.exports = model('WatchHistory', WatchHistorySchema);