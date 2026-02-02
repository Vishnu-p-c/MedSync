const mongoose = require('mongoose');
const db = require('./config/db');
const AmbulanceDriver = require('./models/AmbulanceDriver');

async function migrate() {
  try {
    await db();
    console.log('Connected to database');

    // Update all existing driver records that don't have fcm_token or token_last_update
    const result = await AmbulanceDriver.updateMany(
      {
        $or: [
          { fcm_token: { $exists: false } },
          { token_last_update: { $exists: false } }
        ]
      },
      {
        $set: {
          fcm_token: null,
          token_last_update: null
        }
      }
    );

    console.log(`Migration complete. Updated ${result.modifiedCount} driver records.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
