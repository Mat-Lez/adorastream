const { Schema, model } = require('mongoose');
const AuditLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  method: String,
  path: String,
  status: Number,
  ip: String,
  // store small snapshot (avoid full bodies)
  meta: Schema.Types.Mixed
}, { timestamps: true });

module.exports = model('AuditLog', AuditLogSchema);