import dotenv from "dotenv";
import app from "./app.js";
import { initDb } from "./config/database.js";

dotenv.config();

const PORT = parseInt(process.env.PORT || "5000", 10);

async function startServer() {
  try {
    await initDb();

    const server = app.listen(PORT, () => {
      console.log(` HabitForge API server running on http://localhost:${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
    });

    return server;
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
