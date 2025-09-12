const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/streaming_app';

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI, { autoIndex: true });
}

module.exports = { connectDB, mongoose };