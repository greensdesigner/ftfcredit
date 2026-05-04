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

  // User Signup
  app.post("/api/auth/signup", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { uid, email, fullName, role } = req.body;
    try {
      await pool.query(
        "INSERT INTO users (uid, email, fullName, role) VALUES (?, ?, ?, ?)",
        [uid, email, fullName, role || 'client']
      );
      res.json({ status: "success", message: "User created in DB" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get User Profile
  app.get("/api/users/:uid", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      const [rows]: any = await pool.query("SELECT * FROM users WHERE uid = ?", [req.params.uid]);
      if (rows.length === 0) return res.status(404).json({ error: "User not found" });
      res.json(rows[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update Onboarding Progress
  app.patch("/api/users/:uid/onboarding", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { step, plaidConnected, achAuthorized } = req.body;
    try {
      await pool.query(
        "UPDATE users SET onboardingStep = ?, plaidConnected = ?, achAuthorized = ? WHERE uid = ?",
        [step, plaidConnected, achAuthorized, req.params.uid]
      );
      res.json({ status: "success" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create Subscription
  app.post("/api/subscriptions", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { userId, planName, amount } = req.body;
    try {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      await pool.query(
        "INSERT INTO subscriptions (userId, planName, amount, status, nextBillingDate) VALUES (?, ?, ?, 'active', ?)",
        [userId, planName, amount, nextMonth]
      );
      res.json({ status: "success" });
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
