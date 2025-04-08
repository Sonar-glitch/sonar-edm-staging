/**
 * MongoDB database connection for Sonar EDM Platform
 * 
 * This module provides functions to connect to MongoDB
 * using the centralized configuration system.
 */

const mongoose = require('mongoose');
const config = require('../config');

// Track connection status
let isConnected = false;

/**
 * Connect to MongoDB database
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
async function connectToDatabase() {
  // If already connected, return the existing connection
  if (isConnected) {
    return mongoose.connection;
  }

  // Validate MongoDB configuration
  if (!config.mongodb.isConfigured()) {
    throw new Error('MongoDB connection string is not configured');
  }

  try {
    // Configure mongoose
    mongoose.set('strictQuery', true);
    
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: config.mongodb.dbName
    });

    isConnected = true;
    console.log('Connected to MongoDB');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

module.exports = {
  connectToDatabase,
  mongoose
};
