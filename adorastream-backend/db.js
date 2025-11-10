const mongoose = require('mongoose');

async function connectDB() {
  mongoose.set('strictQuery', true);

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: true });
}

module.exports = { connectDB, mongoose };

