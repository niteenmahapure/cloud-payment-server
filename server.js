const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 🔹 AUTO-CREATE TABLE ON SERVER START
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        client_name TEXT,
        phone TEXT,
        amount NUMERIC,
        rm_name TEXT,
        screenshot_url TEXT,
        status TEXT DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ payments table ready');
  } catch (err) {
    console.error('❌ DB init failed:', err);
  }
}

initDB();

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Cloud Payment Server Running',
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
