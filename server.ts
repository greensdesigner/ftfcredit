import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Database Connection Configuration (Ready for Hostinger)
  // These should be set in your Secrets panel or .env file
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  let pool: any;

  // Function to initialize DB if credentials are provided
  if (process.env.DB_HOST) {
    try {
      pool = mysql.createPool(dbConfig);
      console.log("Connected to Hostinger database pool");
    } catch (error) {
      console.error("Database connection failed:", error);
    }
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  // Example: Get Users from Database
  app.get("/api/users", async (req, res) => {
    if (!pool) {
      return res.status(500).json({ error: "Database not configured. Please set DB_HOST in environment variables." });
    }
    try {
      const [rows] = await pool.query("SELECT id, fullName, email, role FROM users");
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Example: Create User
  app.post("/api/users", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { fullName, email, role } = req.body;
    try {
      const [result] = await pool.query(
        "INSERT INTO users (fullName, email, role) VALUES (?, ?, ?)",
        [fullName, email, role]
      );
      res.json({ id: (result as any).insertId, status: "created" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!process.env.DB_HOST) {
      console.warn("WARNING: DB_HOST is not set. Database features will be limited.");
    }
  });
}

startServer();
