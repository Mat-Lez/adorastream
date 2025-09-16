const { Schema, model } = require('mongoose');
const cleanMongoResponse = require('../utils/responseHelper');

const ProfileSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 30 },
    avatarUrl: { type: String, default: '' }
  },
  { _id: true }
);
ProfileSchema.plugin(cleanMongoResponse);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
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