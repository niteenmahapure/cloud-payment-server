const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// serve frontend
app.use(express.static("public"));

// database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// root health check
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Cloud Payment Server Running" });
});

// admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

// GET all payments
app.get("/payments", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM payments ORDER BY id DESC"
    );
    res.json({ status: "success", data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST new payment
app.post("/payments", async (req, res) => {
  const { client_name, phone, amount, rm_name, screenshot_url } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO payments
       (client_name, phone, amount, rm_name, screenshot_url)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [client_name, phone, amount, rm_name, screenshot_url]
    );

    res.json({ status: "success", data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});

// UPDATE payment status
app.put("/payments/:id", async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!status) {
    return res.status(400).json({ error: "Status required" });
  }

  try {
    await pool.query(
      "UPDATE payments SET status=$1 WHERE id=$2",
      [status, id]
    );
    res.json({ status: "updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
