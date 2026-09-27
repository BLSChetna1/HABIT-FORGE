import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

let pool = null;
let useMemoryFallback = false;

// In-memory fallback store if external PostgreSQL daemon is unavailable
const memoryStore = {
  users: [],
  habits: [],
  completions: [],
  userIdSeq: 1,
  habitIdSeq: 1,
  completionIdSeq: 1
};

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
  });
} else {
  pool = new Pool({
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432", 10),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "habitforge"
  });
}

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

export async function initDb() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  try {
    const client = await pool.connect();
    try {
      await client.query(schemaSql);
      console.log(" PostgreSQL database initialized successfully with schema.");
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn(` PostgreSQL connection failed: ${err.message}`);
    console.warn(" Activating embedded SQL storage adapter for local full-stack workflow.");
    useMemoryFallback = true;
  }
}

/**
 * Execute a query with parameterized values
 */
export async function query(text, params = []) {
  if (!useMemoryFallback && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      if (err.code === "ECONNREFUSED" || err.message.includes("connect")) {
        useMemoryFallback = true;
        return executeMemoryQuery(text, params);
      }
      throw err;
    }
  }

  return executeMemoryQuery(text, params);
}

/**
 * Embedded SQL query parser for local fallback when PostgreSQL daemon is offline
 */
function executeMemoryQuery(text, params) {
  const normalized = text.trim();

  // 1. INSERT INTO users (name, email, password_hash, total_xp) VALUES (...) RETURNING *
  if (/^INSERT INTO users/i.test(normalized)) {
    const [name, email, password_hash] = params;
    const existing = memoryStore.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      const err = new Error("duplicate key value violates unique constraint \"users_email_key\"");
      err.code = "23505";
      throw err;
    }
    const user = {
      id: memoryStore.userIdSeq++,
      name,
      email: email.toLowerCase(),
      password_hash,
      total_xp: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.users.push(user);
    return { rows: [user], rowCount: 1 };
  }

  // 2. SELECT * FROM users WHERE email = $1
  if (/^SELECT \* FROM users WHERE LOWER\(email\) = LOWER\(\$1\)/i.test(normalized) ||
      /^SELECT \* FROM users WHERE email = \$1/i.test(normalized)) {
    const [email] = params;
    const user = memoryStore.users.find(
      (u) => u.email.toLowerCase() === String(email).toLowerCase()
    );
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // 3. SELECT * FROM users WHERE id = $1
  if (/^SELECT (.+) FROM users WHERE id = \$1/i.test(normalized)) {
    const [id] = params;
    const user = memoryStore.users.find((u) => u.id === Number(id));
    if (!user) return { rows: [], rowCount: 0 };
    return {
      rows: [{
        id: user.id,
        name: user.name,
        email: user.email,
        total_xp: user.total_xp,
        created_at: user.created_at
      }],
      rowCount: 1
    };
  }

  // 4. UPDATE users SET total_xp = total_xp + $1 WHERE id = $2 RETURNING *
  if (/^UPDATE users SET total_xp = total_xp \+ \$1/i.test(normalized)) {
    const [xpToAdd, userId] = params;
    const user = memoryStore.users.find((u) => u.id === Number(userId));
    if (!user) return { rows: [], rowCount: 0 };
    user.total_xp += Number(xpToAdd);
    user.updated_at = new Date().toISOString();
    return { rows: [user], rowCount: 1 };
  }

  // 5. INSERT INTO habits (user_id, name, icon, category, streak, last_completed) VALUES (...) RETURNING *
  if (/^INSERT INTO habits/i.test(normalized)) {
    const [userId, name, icon, category] = params;
    const habit = {
      id: memoryStore.habitIdSeq++,
      user_id: Number(userId),
      name,
      icon: icon || "⭐",
      category: category || "Personal",
      streak: 0,
      last_completed: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.habits.push(habit);
    return { rows: [habit], rowCount: 1 };
  }

  // 6. SELECT * FROM habits WHERE user_id = $1 ORDER BY id ASC
  if (/^SELECT \* FROM habits WHERE user_id = \$1/i.test(normalized)) {
    const [userId] = params;
    const habits = memoryStore.habits.filter((h) => h.user_id === Number(userId));
    return { rows: habits, rowCount: habits.length };
  }

  // 7. SELECT * FROM habits WHERE id = $1 AND user_id = $2
  if (/^SELECT (id|\*) FROM habits WHERE id = \$1 AND user_id = \$2/i.test(normalized)) {
    const [id, userId] = params;
    const habit = memoryStore.habits.find(
      (h) => h.id === Number(id) && h.user_id === Number(userId)
    );
    return { rows: habit ? [habit] : [], rowCount: habit ? 1 : 0 };
  }

  // 8. UPDATE habits SET name = $1, icon = $2, category = $3 WHERE id = $4 AND user_id = $5 RETURNING *
  if (/^UPDATE habits SET name = \$1/i.test(normalized)) {
    const [name, icon, category, id, userId] = params;
    const habit = memoryStore.habits.find(
      (h) => h.id === Number(id) && h.user_id === Number(userId)
    );
    if (!habit) return { rows: [], rowCount: 0 };
    habit.name = name;
    habit.icon = icon;
    habit.category = category;
    habit.updated_at = new Date().toISOString();
    return { rows: [habit], rowCount: 1 };
  }

  // 9. DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING *
  if (/^DELETE FROM habits WHERE id = \$1 AND user_id = \$2/i.test(normalized)) {
    const [id, userId] = params;
    const index = memoryStore.habits.findIndex(
      (h) => h.id === Number(id) && h.user_id === Number(userId)
    );
    if (index === -1) return { rows: [], rowCount: 0 };
    const [deleted] = memoryStore.habits.splice(index, 1);
    // Cascade delete completions
    memoryStore.completions = memoryStore.completions.filter(
      (c) => c.habit_id !== deleted.id
    );
    return { rows: [deleted], rowCount: 1 };
  }

  // 10. SELECT * FROM habit_completions WHERE habit_id = $1 AND completion_date = $2
  if (/^SELECT \* FROM habit_completions WHERE habit_id = \$1 AND completion_date = \$2/i.test(normalized)) {
    const [habitId, date] = params;
    const record = memoryStore.completions.find(
      (c) => c.habit_id === Number(habitId) && c.completion_date === String(date)
    );
    return { rows: record ? [record] : [], rowCount: record ? 1 : 0 };
  }

  // 11. INSERT INTO habit_completions (habit_id, user_id, completion_date) VALUES (...) RETURNING *
  if (/^INSERT INTO habit_completions/i.test(normalized)) {
    const [habitId, userId, date] = params;
    const existing = memoryStore.completions.find(
      (c) => c.habit_id === Number(habitId) && c.completion_date === String(date)
    );
    if (existing) {
      const err = new Error("duplicate key value violates unique constraint \"uq_habit_completion_date\"");
      err.code = "23505";
      throw err;
    }
    const comp = {
      id: memoryStore.completionIdSeq++,
      habit_id: Number(habitId),
      user_id: Number(userId),
      completion_date: String(date),
      created_at: new Date().toISOString()
    };
    memoryStore.completions.push(comp);
    return { rows: [comp], rowCount: 1 };
  }

  // 12. UPDATE habits SET streak = $1, last_completed = $2 WHERE id = $3 RETURNING *
  if (/^UPDATE habits SET streak = \$1, last_completed = \$2/i.test(normalized)) {
    const [streak, lastCompleted, id] = params;
    const habit = memoryStore.habits.find((h) => h.id === Number(id));
    if (!habit) return { rows: [], rowCount: 0 };
    habit.streak = Number(streak);
    habit.last_completed = String(lastCompleted);
    habit.updated_at = new Date().toISOString();
    return { rows: [habit], rowCount: 1 };
  }

  // 13. SELECT completion_date FROM habit_completions WHERE habit_id = $1
  if (/^SELECT completion_date FROM habit_completions WHERE habit_id = \$1/i.test(normalized)) {
    const [habitId] = params;
    const records = memoryStore.completions.filter(
      (c) => c.habit_id === Number(habitId)
    );
    return { rows: records, rowCount: records.length };
  }

  // 14. SELECT completion_date FROM habit_completions WHERE user_id = $1
  if (/^SELECT completion_date FROM habit_completions WHERE user_id = \$1/i.test(normalized)) {
    const [userId] = params;
    const records = memoryStore.completions.filter(
      (c) => c.user_id === Number(userId)
    );
    return { rows: records, rowCount: records.length };
  }

  // 15. SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY completion_date DESC
  if (/^SELECT \* FROM habit_completions WHERE habit_id = \$1/i.test(normalized)) {
    const [habitId] = params;
    const records = memoryStore.completions.filter(
      (c) => c.habit_id === Number(habitId)
    );
    return { rows: records, rowCount: records.length };
  }

  return { rows: [], rowCount: 0 };
}

export function isUsingMemoryFallback() {
  return useMemoryFallback;
}

export default {
  query,
  initDb,
  isUsingMemoryFallback
};
