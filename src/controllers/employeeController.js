const pool = require('../config/database');

// Get all employees
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "Employee" WHERE is_deleted = false ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get employees by department
exports.getByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const result = await pool.query(
      'SELECT * FROM "Employee" WHERE department = $1 AND is_deleted = false ORDER BY name',
      [department]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all departments
exports.getDepartments = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT department FROM "Employee" WHERE is_deleted = false ORDER BY department'
    );
    res.json(result.rows.map(r => r.department));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get employee ledger
exports.getLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await pool.query('SELECT * FROM "Employee" WHERE id = $1', [id]);
    const payments = await pool.query(
      'SELECT * FROM "Payment" WHERE particulars LIKE $1 ORDER BY timestamp DESC',
      [`%Employee ID: ${id}%`]
    );
    res.json({ employee: employee.rows[0], payments: payments.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create employee
exports.create = async (req, res) => {
  try {
    const { name, age, designation, department, salary, balance_remaining } = req.body;
    const result = await pool.query(
      'INSERT INTO "Employee" (name, age, designation, department, salary, balance_remaining) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, age, designation, department, salary, balance_remaining || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update employee
exports.update = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("SET TIMEZONE='Asia/Karachi'");
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { name, age, designation, department, salary, balance_remaining } = req.body;
    
    // Get current employee data
    const currentEmployee = await client.query('SELECT * FROM "Employee" WHERE id = $1', [id]);
    const oldBalance = parseFloat(currentEmployee.rows[0].balance_remaining);
    const newBalance = parseFloat(balance_remaining);
    
    // Update employee
    const result = await client.query(
      'UPDATE "Employee" SET name = $1, age = $2, designation = $3, department = $4, salary = $5, balance_remaining = $6 WHERE id = $7 RETURNING *',
      [name, age, designation, department, salary, balance_remaining, id]
    );
    
    // If balance changed, create a ledger entry
    if (oldBalance !== newBalance) {
      const balanceChange = newBalance - oldBalance;
      const changeType = balanceChange > 0 ? 'Balance Added' : 'Balance Reduced';
      const particulars = `${changeType} | Employee ID: ${id} | Employee: ${name} | Previous Balance: ${oldBalance} | New Balance: ${newBalance}`;
      
      // Find or create "Balance Adjustment" expense head
      let expenseHead = await client.query('SELECT id FROM "ExpenseHead" WHERE name = $1', ['Balance Adjustment']);
      if (expenseHead.rows.length === 0) {
        expenseHead = await client.query('INSERT INTO "ExpenseHead" (name) VALUES ($1) RETURNING id', ['Balance Adjustment']);
      }
      
      // Create a payment record for the ledger (with 0 amount since it's just a balance adjustment)
      await client.query(
        'INSERT INTO "Payment" (payment_number, name, amount, particulars, expense_head_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())',
        [`BAL-${Date.now()}`, name, 0, particulars, expenseHead.rows[0].id]
      );
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Soft delete employee
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE "Employee" SET is_deleted = true WHERE id = $1', [id]);
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
