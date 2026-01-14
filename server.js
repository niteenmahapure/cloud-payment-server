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

// 🔹 Initialize Database (AUTO CREATE TABLE)
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        client_name TEXT NOT NULL,
        phone TEXT,
        amount NUMERIC,
        rm_name TEXT,
        screenshot_url TEXT,
        status TEXT DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database connected & table ready');
  } catch (err) {
    console.error('❌ DB init error:', err);
  }
}
initDB();

// 🔹 Health Check
app.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.send('✅ Server OK + DB Connected');
  } catch (err) {
    res.status(500).send('❌ DB Connection Failed');
  }
});

// 🔹 Create Payment
app.post('/payments', async (req, res) => {
  const { client_name, phone, amount, rm_name, screenshot_url } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO payments 
      (client_name, phone, amount, rm_name, screenshot_url)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [client_name, phone, amount, rm_name, screenshot_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// 🔹 Get All Payments (Admin)
app.get('/payments', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// 🔹 Update Payment Status (Approve / Reject)
app.put('/payments/:id', async (req, res) => {
  const { status } = req.body;

  try {
    await pool.query(
      'UPDATE payments SET status=$1 WHERE id=$2',
      [status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// 🔹 Render-compatible Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
