
const readline = require("readline");
const bcrypt = require("bcrypt");
const pool = require("./config/db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdmin() {
  try {
    const fullName = (await ask("Admin full name: ")).trim();
    const email = (await ask("Admin email: ")).trim().toLowerCase();
    const password = await ask("Admin password (hidden input not enabled): ");

    if (!fullName || !email || !password) {
      console.log("All fields are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      console.log("Password must be at least 8 characters.");
      return;
    }

    const existing = await pool.query(
      `SELECT user_id, role FROM users WHERE LOWER(email) = $1`,
      [email]
    );

    if (existing.rows.length > 0) {
      console.log(
        `This email already exists with role: ${existing.rows[0].role}. No changes made.`
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING user_id, full_name, email, role`,
      [fullName, email, passwordHash]
    );

    console.log("Admin account created successfully:");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();
