const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Create test users with new schema
    const users = [
      {
        user_id: 1,
        username: 'admin',
        password_hash: 'admin123',
        role: 'admin',
        phone: '1234567890'
      },
      {
        user_id: 2,
        username: 'doctor1',
        password_hash: 'doctor123',
        role: 'doctor',
        phone: '0987654321'
      },
      {
        user_id: 3,
        username: 'thusharpradeep',
        password_hash: 'test123',
        role: 'admin',
        phone: '5555555555'
      }
    ];

    // Clear existing users (optional)
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Insert users
    await User.insertMany(users);
    console.log('Test users created successfully!');
    console.log(
        'Users:', users.map(u => ({username: u.username, role: u.role})));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedUsers();
