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

// Health check
app.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.send('Server OK + DB Connected');
  } catch (err) {
    console.error(err);
    res.status(500).send('DB Connection Failed');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
