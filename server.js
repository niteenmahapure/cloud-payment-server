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

// ✅ Health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Cloud Payment Server Running"
  });
});

// ✅ CREATE PAYMENT (POST /payments)
app.post("/payments", async (req, res) => {
  try {
    const {
      client_name,
      phone,
      amount,
      rm_name,
      screenshot_url
    } = req.body;

    if (!client_name || !phone || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO payments 
      (client_name, phone, amount, rm_name, screenshot_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [client_name, phone, amount, rm_name, screenshot_url]
    );

    res.status(201).json({
      status: "success",
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database insert failed" });
  }
});

// ✅ GET ALL PAYMENTS (Admin)
app.get("/payments", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM payments ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database fetch failed" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
