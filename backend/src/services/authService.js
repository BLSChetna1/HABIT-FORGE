import bcrypt from "bcryptjs";
import { query } from "../config/database.js";
import { generateToken } from "../utils/jwtUtils.js";

const SALT_ROUNDS = 10;

export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already exists
  const existingCheck = await query(
    "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
    [normalizedEmail]
  );

  if (existingCheck.rows.length > 0) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user
  const result = await query(
    "INSERT INTO users (name, email, password_hash, total_xp) VALUES ($1, $2, $3, 0) RETURNING id, name, email, total_xp, created_at",
    [name.trim(), normalizedEmail, passwordHash]
  );

  const user = result.rows[0];
  const token = generateToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      total_xp: user.total_xp,
      created_at: user.created_at
    },
    token
  };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      total_xp: user.total_xp,
      created_at: user.created_at
    },
    token
  };
}

export async function getUserById(id) {
  const result = await query(
    "SELECT id, name, email, total_xp, created_at FROM users WHERE id = $1",
    [id]
  );

  if (result.rows.length === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}
