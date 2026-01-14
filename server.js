const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// ---- DATABASE ----
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ---- ROOT TEST ROUTE (VERY IMPORTANT) ----
app.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "OK",
      message: "Server is running",
      database: "Connected",
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
    });
  }
});

// ---- FALLBACK (DEBUG) ----
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// ---- START SERVER ----
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server started on port", PORT);
});
