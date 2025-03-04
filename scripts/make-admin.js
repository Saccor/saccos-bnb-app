/**
 * This script makes a user an admin for testing purposes.
 * Usage: node scripts/make-admin.js <email>
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Check if email is provided
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  console.error('Usage: node scripts/make-admin.js <email>');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define User schema
const UserSchema = new mongoose.Schema({
  namn: String,
  epost: String,
  losenord: String,
  isAdmin: Boolean,
  skapadDatum: { type: Date, default: Date.now }
});

// Get User model
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function makeAdmin() {
  try {
    // Find user by email
    const user = await User.findOne({ epost: email });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    // Update user to admin
    user.isAdmin = true;
    await user.save();
    
    console.log(`User ${user.namn} (${user.epost}) is now an admin`);
    process.exit(0);
  } catch (error) {
    console.error('Error making user admin:', error);
    process.exit(1);
  }
}

makeAdmin(); 