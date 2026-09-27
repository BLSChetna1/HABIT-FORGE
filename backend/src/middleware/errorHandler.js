export function errorHandler(err, req, res, _next) {
  console.error("Express Error:", err);

  const statusCode = err.status || err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Handle unique constraint violation in PostgreSQL (code 23505)
  if (err.code === "23505") {
    if (err.constraint === "uq_habit_completion_date" || err.message.includes("uq_habit_completion_date")) {
      return res.status(409).json({ error: "Habit already completed today" });
    }
    if (err.constraint === "users_email_key" || err.message.includes("users_email_key")) {
      return res.status(409).json({ error: "Email already registered" });
    }
    return res.status(409).json({ error: "A resource with these unique values already exists" });
  }

  // Handle invalid JSON body syntax from express.json()
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON payload in request body" });
  }

  // Safe message in production
  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = "An unexpected server error occurred";
  }

  res.status(statusCode).json({
    error: message
  });
}
