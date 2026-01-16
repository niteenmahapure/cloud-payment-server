const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ Health check
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Cloud Payment Server Running'
  });
});

// ✅ STEP 10 — CREATE PAYMENT
app.post('/payments', async (req, res) => {
  try {
    const { client_name, phone, amount, rm_name, screenshot_url } = req.body;

    const result = await pool.query(
      `INSERT INTO payments 
      (client_name, phone, amount, rm_name, screenshot_url) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [client_name, phone, amount, rm_name, screenshot_url]
    );

    res.status(201).json({
      status: 'success',
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// ✅ STEP 11 — GET ALL PAYMENTS (ADMIN)
app.get('/payments', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments ORDER BY created_at DESC'
    );

    res.json({
      status: 'success',
      data: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('🚀 Server started on port', PORT);
});

// ✅ STEP 12 — UPDATE PAYMENT STATUS (APPROVE / REJECT)
app.put('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status value'
      });
    }

    const result = await pool.query(
      `UPDATE payments 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      status: 'success',
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});
