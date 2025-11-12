const { Schema, model } = require('mongoose');
const cleanMongoResponse = require('../utils/responseHelper');

const ErrorLogSchema = new Schema({
  message: { type: String, required: true },
  name: { type: String, default: null },
  stack: { type: String, default: null },
  status: { type: Number, default: 500 },
  severity: {
    type: String,
    enum: ['critical', 'error', 'warning', 'info'],
    default: 'error'
  },
  component: { type: String, default: 'unknown' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  request: {
    method: String,
    path: String,
    query: Schema.Types.Mixed,
    body: Schema.Types.Mixed,
    headers: {
      'user-agent': String,
      'x-request-id': String
    },
    ip: String
  },
  meta: Schema.Types.Mixed
}, { timestamps: true });

ErrorLogSchema.plugin(cleanMongoResponse);

module.exports = model('ErrorLog', ErrorLogSchema);


