const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// -------------------- DATABASE --------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Auto-create table
async function initDB() {
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
  console.log("✅ Payments table ready");
}
initDB();

// -------------------- HEALTH CHECK --------------------
app.get("/", async (req, res) => {
  await pool.query("SELECT 1");
  res.json({
    status: "OK",
    message: "Cloud Payment Server Running"
  });
});

// -------------------- USER: SUBMIT PAYMENT --------------------
app.post("/payments", async (req, res) => {
  try {
    const { client_name, phone, amount, rm_name, screenshot_url } = req.body;

    if (!client_name || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO payments
      (client_name, phone, amount, rm_name, screenshot_url)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [client_name, phone, amount, rm_name, screenshot_url]
    );

    res.status(201).json({
      success: true,
      payment: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment submission failed" });
  }
});

// -------------------- ADMIN: GET ALL PAYMENTS --------------------
app.get("/payments", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM payments ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// -------------------- ADMIN: APPROVE / REJECT --------------------
app.put("/payments/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    await pool.query(
      "UPDATE payments SET status=$1 WHERE id=$2",
      [status, id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Status update failed" });
  }
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
