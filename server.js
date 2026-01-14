const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Root health check
app.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "OK",
      message: "Cloud Payment Server Running"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Get all payments
app.get("/payments", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM payments ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Create payment
app.post("/payments", async (req, res) => {
  const { client_name, phone, amount, rm_name, screenshot_url } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO payments 
      (client_name, phone, amount, rm_name, screenshot_url, status)
      VALUES ($1, $2, $3, $4, $5, 'Pending')
      RETURNING *`,
      [client_name, phone, amount, rm_name, screenshot_url]
    );

    res.json({ success: true, payment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment insert failed" });
  }
});

// Update payment status
app.put("/payments/:id", async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    await pool.query(
      "UPDATE payments SET status=$1 WHERE id=$2",
      [status, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Render port binding
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
