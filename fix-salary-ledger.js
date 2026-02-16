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

async function fixSalaryLedger() {
  const client = await pool.connect();
  
  try {
    console.log('Fixing existing salary payment records...\n');

    // Find all salary payments that have employee names but no Employee ID
    const result = await client.query(`
      SELECT p.id, p.particulars, e.id as employee_id, e.name as employee_name
      FROM "Payment" p
      JOIN "ExpenseHead" eh ON p.expense_head_id = eh.id
      JOIN "Employee" e ON p.particulars LIKE '%Employee: ' || e.name || '%'
      WHERE eh.name = 'Salary' 
      AND p.particulars NOT LIKE '%Employee ID:%'
    `);

    if (result.rows.length === 0) {
      console.log('✓ No salary payments need fixing.');
      console.log('All salary records already have Employee ID.');
    } else {
      console.log(`Found ${result.rows.length} salary payment(s) to fix...\n`);
      
      for (const row of result.rows) {
        // Add Employee ID to particulars at the beginning (right after the initial description)
        const updatedParticulars = row.particulars.replace(
          ` | Employee: ${row.employee_name}`,
          ` | Employee ID: ${row.employee_id} | Employee: ${row.employee_name}`
        );
        
        await client.query(
          'UPDATE "Payment" SET particulars = $1 WHERE id = $2',
          [updatedParticulars, row.id]
        );
        
        console.log(`✓ Fixed payment ID ${row.id} for ${row.employee_name}`);
      }
      
      console.log('\n✅ All salary payment records have been updated!');
      console.log('Employee ledgers will now display correctly.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSalaryLedger();
