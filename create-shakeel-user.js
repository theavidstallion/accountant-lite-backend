const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL || process.env.DatabaseUrl;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createUser() {
  // Hardcoded user details
  const name = 'shakeel';
  const email = 'shakeel@jamiamuhammadia.org.pk';
  const phone = '03335354581';
  const password = 'shakeel123';
  
  try {
    console.log('\n=== Creating User ===\n');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('\nConnecting to database...');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO "User" (name, email, phone_number, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [name, email, phone, hashedPassword]
    );
    
    console.log('\n✅ User created successfully!');
    console.log('User details:', result.rows[0]);
    console.log('\nYou can now login with:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    if (error.code === '23505') {
      console.error('\n❌ Error: Email already exists');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n❌ Error: Database connection timeout');
      console.error('Please check your DATABASE_URL in .env file');
      console.error('Make sure your database is accessible from your network');
    } else {
      console.error('\n❌ Error:', error.message);
    }
  } finally {
    await pool.end();
  }
}

createUser();
