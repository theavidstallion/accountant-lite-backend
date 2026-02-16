const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

// Handle both DATABASE_URL and DatabaseUrl
const connectionString = process.env.DATABASE_URL || process.env.DatabaseUrl;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL or DatabaseUrl not found in .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Dropping existing tables...');
    
    // Drop tables in correct order (child tables first due to foreign keys)
    await client.query(`DROP TABLE IF EXISTS "Receipt" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "Payment" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "Employee" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "ExpenseHead" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "IncomeHead" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "User" CASCADE;`);
    console.log('✓ Existing tables dropped');
    
    console.log('\nCreating database tables...');

    // User table
    await client.query(`
      CREATE TABLE "User" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(50),
        password VARCHAR(255) NOT NULL
      );
    `);
    console.log('✓ User table created');

    // IncomeHead table
    await client.query(`
      CREATE TABLE "IncomeHead" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
    `);
    console.log('✓ IncomeHead table created');

    // ExpenseHead table
    await client.query(`
      CREATE TABLE "ExpenseHead" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
    `);
    console.log('✓ ExpenseHead table created');

    // Employee table
    await client.query(`
      CREATE TABLE "Employee" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age INTEGER,
        designation VARCHAR(255),
        department VARCHAR(255),
        is_deleted BOOLEAN DEFAULT FALSE,
        salary DECIMAL(10, 2),
        balance_remaining DECIMAL(10, 2) DEFAULT 0
      );
    `);
    console.log('✓ Employee table created');

    // Payment table
    await client.query(`
      CREATE TABLE "Payment" (
        id SERIAL PRIMARY KEY,
        payment_number VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        particulars TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expense_head_id INTEGER REFERENCES "ExpenseHead"(id)
      );
    `);
    console.log('✓ Payment table created');

    // Receipt table
    await client.query(`
      CREATE TABLE "Receipt" (
        id SERIAL PRIMARY KEY,
        receipt_number VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        particulars TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        income_head_id INTEGER REFERENCES "IncomeHead"(id)
      );
    `);
    console.log('✓ Receipt table created');

    console.log('\n✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('\nYou can now start the application.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
