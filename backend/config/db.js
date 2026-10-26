const mongoose = require('mongoose');

let mongoServer = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log('Connecting to provided MONGODB_URI...');
      await mongoose.connect(uri);
      console.log('Connected to MongoDB:', mongoose.connection.host);
      return mongoose.connection;
    } catch (err) {
      console.warn('Failed connecting to MONGODB_URI, falling back to embedded Mongo...', err.message);
    }
  }

  // Fallback to mongodb-memory-server for zero-setup execution
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Starting in-memory MongoDB server for standalone zero-config execution...');
    mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();
    await mongoose.connect(memoryUri);
    console.log('Connected to in-memory MongoDB at:', memoryUri);
    return mongoose.connection;
  } catch (err) {
    console.error('Failed to start in-memory MongoDB server:', err.message);
    throw err;
  }
}

async function closeDB() {
  if (mongoose.connection) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

module.exports = { connectDB, closeDB };
