const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

/* ============================
   DATABASE CONNECTION (Render)
============================ */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* ============================
   HEALTH CHECK
============================ */
app.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      message: 'Cloud Payment Server Running'
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed'
    });
  }
});

/* ============================
   CREATE PAYMENT (USER)
   POST /payments
============================ */
app.post('/payments', async (req, res) => {
  try {
    const {
      client_name,
      phone,
      amount,
      rm_name,
      screenshot_url
    } = req.body;

    // Validation
    if (!client_name || !phone || !amount) {
      return res.status(400).json({
        error: 'client_name, phone and amount are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO payments
       (client_name, phone, amount, rm_name, screenshot_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [client_name, phone, amount, rm_name || '', screenshot_url || '']
    );

    res.status(201).json({
      status: 'success',
      message: 'Payment submitted successfully',
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to create payment'
    });
  }
});

/* ============================
   GET ALL PAYMENTS (ADMIN)
   GET /payments
============================ */
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
    res.status(500).json({
      error: 'Failed to fetch payments'
    });
  }
});

/* ============================
   UPDATE PAYMENT STATUS
   APPROVE / REJECT (ADMIN)
   PUT /payments/:id
============================ */
app.put('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ['Pending', 'Approved', 'Rejected'];

    if (!allowedStatus.includes(status)) {
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
      return res.status(404).json({
        error: 'Payment not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Payment status updated',
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to update payment'
    });
  }
});

/* ============================
   SERVER START
============================ */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
