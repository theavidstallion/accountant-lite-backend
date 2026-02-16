const pool = require('../config/database');

// Get all expense heads
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "ExpenseHead" ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create expense head
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      'INSERT INTO "ExpenseHead" (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete expense head
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM "ExpenseHead" WHERE id = $1', [id]);
    res.json({ message: 'Expense head deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
