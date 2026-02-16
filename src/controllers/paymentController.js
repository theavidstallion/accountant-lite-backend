const pool = require('../config/database');

// Set timezone to Pakistan
const setTimezone = async (client) => {
  await client.query("SET TIMEZONE='Asia/Karachi'");
};

// Get all payments
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, e.name as expense_head_name FROM "Payment" p LEFT JOIN "ExpenseHead" e ON p.expense_head_id = e.id ORDER BY p.timestamp DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get salary payments
exports.getSalaries = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, e.name as expense_head_name FROM "Payment" p 
       LEFT JOIN "ExpenseHead" e ON p.expense_head_id = e.id 
       WHERE e.name = 'Salary' ORDER BY p.timestamp DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create payment
exports.create = async (req, res) => {
  const client = await pool.connect();
  try {
    await setTimezone(client);
    await client.query('BEGIN');
    
    const { payment_number, name, amount, particulars, expense_head_id, employee_id } = req.body;
    
    // Create payment
    const payment = await client.query(
      'INSERT INTO "Payment" (payment_number, name, amount, particulars, expense_head_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [payment_number, name, amount, particulars, expense_head_id]
    );
    
    // If employee_id provided (salary payment), update employee balance
    if (employee_id) {
      const employee = await client.query('SELECT * FROM "Employee" WHERE id = $1', [employee_id]);
      const newBalance = parseFloat(employee.rows[0].balance_remaining) - parseFloat(amount);
      
      await client.query(
        'UPDATE "Employee" SET balance_remaining = $1 WHERE id = $2',
        [newBalance, employee_id]
      );
      
      // Add employee info to particulars with Employee ID for ledger lookup
      const updatedParticulars = `${particulars || ''} | Employee ID: ${employee_id} | Employee: ${employee.rows[0].name} | Previous Balance: ${employee.rows[0].balance_remaining} | New Balance: ${newBalance}`;
      await client.query(
        'UPDATE "Payment" SET particulars = $1 WHERE id = $2',
        [updatedParticulars, payment.rows[0].id]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json(payment.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
