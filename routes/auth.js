
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

async function login(req, res, expectedRole) {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    const result = await pool.query(
      `SELECT user_id, full_name, email, password_hash, role
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches || user.role !== expectedRole) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        subject: String(user.user_id),
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Login failed due to a server error",
    });
  }
}

router.post("/student/login", (req, res) => {
  return login(req, res, "student");
});

router.post("/admin/login", (req, res) => {
  return login(req, res, "admin");
});

module.exports = router;
