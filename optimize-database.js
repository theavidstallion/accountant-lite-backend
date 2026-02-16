const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

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

async function optimizeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Creating indexes for better performance...\n');

    // Payment table indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_expensehead 
      ON "Payment"(expense_head_id);
    `);
    console.log('✓ Index on Payment.expense_head_id');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_timestamp 
      ON "Payment"(timestamp DESC);
    `);
    console.log('✓ Index on Payment.timestamp');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_particulars 
      ON "Payment" USING gin(to_tsvector('english', particulars));
    `);
    console.log('✓ Index on Payment.particulars (for ledger search)');

    // Receipt table indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_receipt_incomehead 
      ON "Receipt"(income_head_id);
    `);
    console.log('✓ Index on Receipt.income_head_id');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_receipt_timestamp 
      ON "Receipt"(timestamp DESC);
    `);
    console.log('✓ Index on Receipt.timestamp');

    // Employee table indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employee_department 
      ON "Employee"(department);
    `);
    console.log('✓ Index on Employee.department');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employee_isdeleted 
      ON "Employee"(is_deleted);
    `);
    console.log('✓ Index on Employee.is_deleted');

    // Add ANALYZE to update statistics
    await client.query('ANALYZE "Payment"');
    await client.query('ANALYZE "Receipt"');
    await client.query('ANALYZE "Employee"');
    console.log('\n✓ Database statistics updated');

    console.log('\n✅ Database optimized successfully!');
    console.log('Queries should now be lightning fast.');
    
  } catch (error) {
    console.error('❌ Optimization failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

optimizeDatabase();
