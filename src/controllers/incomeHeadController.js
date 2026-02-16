const pool = require('../config/database');

// Get all income heads
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "IncomeHead" ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create income head
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      'INSERT INTO "IncomeHead" (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete income head
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM "IncomeHead" WHERE id = $1', [id]);
    res.json({ message: 'Income head deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
