const mongoose = require('mongoose');
require('dotenv').config();

// This script is for development purposes only
// It provides a way to reset and reinitialize the database with consistent test data

async function resetDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop the database
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped successfully');

    console.log('Database reset complete!');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

// Run the reset function
resetDatabase(); 