
const express = require("express");
const pool = require("./config/db");
const authRoutes = require("./routes/auth");

require("dotenv").config();

const app = express();
const eventsRouter = require("./routes/events");

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && /^http:\/\/localhost:\d+$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRouter);

app.get("/", (req, res) => {
    res.json({
        message: "CampusPulse API is running",
    });
});

app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT current_database() AS database"
        );

        res.json({
            status: "OK",
            database: result.rows[0].database,
        });
    } catch (error) {
        console.error("Database health check failed:", error.message);

        res.status(500).json({
            status: "ERROR",
            message: "Database connection failed",
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`CampusPulse API running on port ${PORT}`);
});