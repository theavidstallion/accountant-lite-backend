const pool = require('../config/database');

// Set timezone to Pakistan
const setTimezone = async (client) => {
  await client.query("SET TIMEZONE='Asia/Karachi'");
};

// Get all receipts
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.*, i.name as income_head_name FROM "Receipt" r LEFT JOIN "IncomeHead" i ON r.income_head_id = i.id ORDER BY r.timestamp DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create receipt
exports.create = async (req, res) => {
  const client = await pool.connect();
  try {
    await setTimezone(client);
    const { receipt_number, name, amount, particulars, income_head_id } = req.body;
    const result = await client.query(
      'INSERT INTO "Receipt" (receipt_number, name, amount, particulars, income_head_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [receipt_number, name, amount, particulars, income_head_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
