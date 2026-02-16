const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../..', '.env') });

// Handle both DATABASE_URL and DatabaseUrl
const connectionString = process.env.DATABASE_URL || process.env.DatabaseUrl;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
