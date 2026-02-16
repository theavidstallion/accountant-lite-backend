const pool = require('../config/database');

// Get all records with filters
exports.getAll = async (req, res) => {
  try {
    const { startDate, endDate, type, headId, headType } = req.query;
    
    let receipts = [];
    let payments = [];
    
    if (!type || type === 'receipt') {
      let query = 'SELECT r.*, i.name as head_name, \'receipt\' as type FROM "Receipt" r LEFT JOIN "IncomeHead" i ON r.income_head_id = i.id WHERE 1=1';
      const params = [];
      
      if (startDate) {
        params.push(startDate);
        query += ` AND r.timestamp >= $${params.length}`;
      }
      if (endDate) {
        params.push(endDate);
        query += ` AND r.timestamp <= $${params.length}`;
      }
      if (headId && headType === 'income') {
        params.push(headId);
        query += ` AND r.income_head_id = $${params.length}`;
      }
      
      const result = await pool.query(query + ' ORDER BY r.timestamp DESC', params);
      receipts = result.rows;
    }
    
    if (!type || type === 'payment') {
      let query = 'SELECT p.*, e.name as head_name, \'payment\' as type FROM "Payment" p LEFT JOIN "ExpenseHead" e ON p.expense_head_id = e.id WHERE 1=1';
      const params = [];
      
      if (startDate) {
        params.push(startDate);
        query += ` AND p.timestamp >= $${params.length}`;
      }
      if (endDate) {
        params.push(endDate);
        query += ` AND p.timestamp <= $${params.length}`;
      }
      if (headId && headType === 'expense') {
        params.push(headId);
        query += ` AND p.expense_head_id = $${params.length}`;
      }
      
      const result = await pool.query(query + ' ORDER BY p.timestamp DESC', params);
      payments = result.rows;
    }
    
    const records = [...receipts, ...payments].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
