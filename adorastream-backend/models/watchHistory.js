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

    lastWatchedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

WatchHistorySchema.index(
  { userId: 1, profileId: 1, contentId: 1 },
  { unique: true, name: 'uniq_user_profile_content' }
);
WatchHistorySchema.plugin(cleanMongoResponse);
const WatchHistory = model('WatchHistory', WatchHistorySchema);

/**
 * @description Stores a single record of a user/profile watching a
 * specific piece of content on a specific day.
 * This is used for "activity feed" and "daily count" stats, where the
 * main watchHistory is only for "last progress".
 */
const DailyWatchSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
    profileId: { type: Types.ObjectId, index: true, required: true },
    contentId: { type: Types.ObjectId, ref: 'Content', index: true, required: true },
    
    // This field suppose to store the very start of the day (00:00:00)
    date: { type: Date, index: true, required: true },
  },
  { timestamps: true }
);

DailyWatchSchema.index(
  { userId: 1, profileId: 1, contentId: 1, date: 1 },
  { unique: true, name: 'uniq_user_profile_content_day' }
);

DailyWatchSchema.plugin(cleanMongoResponse);
const DailyWatch = model('DailyWatch', DailyWatchSchema);

module.exports = {
    WatchHistory,
    DailyWatch
};