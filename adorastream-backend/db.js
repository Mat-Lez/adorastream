const mongoose = require('mongoose');

async function connectDB() {
  mongoose.set('strictQuery', true);

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const connectionString = process.env.MONGODB_URI;
  await mongoose.connect(connectionString, { autoIndex: true });
}

module.exports = { connectDB, mongoose };

