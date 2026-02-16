const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const readline = require('readline');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL || process.env.DatabaseUrl;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createUser() {
  try {
    console.log('\n=== Create First User ===\n');
    
    const name = await question('Enter name: ');
    const email = await question('Enter email: ');
    const phone = await question('Enter phone number: ');
    const password = await question('Enter password: ');
    
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
    } else {
      console.error('\n❌ Error:', error.message);
    }
  } finally {
    rl.close();
    await pool.end();
  }
}

createUser();
