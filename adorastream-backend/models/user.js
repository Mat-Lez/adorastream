const { Schema, model } = require('mongoose');
const cleanMongoResponse = require('../utils/responseHelper');

const ProfileSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 30 },
    // Store only relative path under backend public/ (e.g., "profile-photos/<userId>/<profileId>/avatar.png")
    avatarPath: { type: String, default: '' }
  },
  { _id: true }
);
ProfileSchema.plugin(cleanMongoResponse);

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ['user'], enum: ['user', 'admin'] },
    profiles: {
      type: [ProfileSchema],
      default: [],
      validate: [arr => arr.length <= 5, 'Max 5 profiles allowed']
    }
  },
  { timestamps: true }
);

// convenience virtual
UserSchema.virtual('isAdmin').get(function () {
  return (this.roles || []).includes('admin');
});
UserSchema.plugin(cleanMongoResponse);
module.exports = model('User', UserSchema);