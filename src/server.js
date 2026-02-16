const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const authMiddleware = require('./middleware/auth');

// Middleware
app.use(cors());
app.use(express.json());

// Auth routes (public)
app.use('/api/auth', require('./routes/auth'));

// Protected routes
app.use('/api/income-heads', authMiddleware, require('./routes/incomeHeads'));
app.use('/api/expense-heads', authMiddleware, require('./routes/expenseHeads'));
app.use('/api/employees', authMiddleware, require('./routes/employees'));
app.use('/api/receipts', authMiddleware, require('./routes/receipts'));
app.use('/api/payments', authMiddleware, require('./routes/payments'));
app.use('/api/records', authMiddleware, require('./routes/records'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
