const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* ROOT HEALTH CHECK */
app.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'OK',
      server: 'running',
      database: 'connected'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'ERROR',
      database: 'not connected'
    });
  }
});

/* TEST ROUTE */
app.get('/test', (req, res) => {
  res.send('Test route working');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
