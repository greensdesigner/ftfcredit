import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Database Connection Configuration (Ready for Hostinger)
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

  if (process.env.DB_HOST) {
    try {
      pool = mysql.createPool(dbConfig);
      console.log("Connected to Hostinger database pool");
    } catch (error) {
      console.error("Database connection failed:", error);
    }
  }

  // Health Check for Hostinger/Deployment monitoring
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  // API Routes
  app.get("/api/health", async (req, res) => {
    let dbStatus = "not configured";
    if (pool) {
      try {
        await pool.query("SELECT 1");
        dbStatus = "connected";
      } catch (err: any) {
        dbStatus = `error: ${err.message}`;
      }
    }
    
    res.json({ 
      status: "ok", 
      message: "Server is running",
      env: process.env.NODE_ENV,
      database: dbStatus,
      time: new Date().toISOString()
    });
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
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Using Vite middleware (development)");
  } else {
    // Production static serving
    // When running from dist/server.js, __dirname is the 'dist' folder itself.
    // We try to find the best path for dist files.
    let distPath = __dirname;
    
    // Check if this is running from dist/ already (bundled case)
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
        distPath = path.resolve(process.cwd(), 'dist');
    }

    const indexPath = path.join(distPath, 'index.html');
    
    console.log(`[Production] Mode Active`);
    console.log(`[Production] Working Directory: ${process.cwd()}`);
    console.log(`[Production] Script Directory: ${__dirname}`);
    console.log(`[Production] Serving assets from: ${distPath}`);
    
    if (!fs.existsSync(indexPath)) {
      console.error(`[CRITICAL] index.html NOT FOUND at: ${indexPath}`);
    }
    
    // 1. Serve static assets
    app.use(express.static(distPath, { index: false }));
    
    // 2. Fallback for SPA
    app.get('*', (req, res) => {
      // Don't serve HTML for API requests that fall through
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "API endpoint not found" });
      }

      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`[Error] Failed to send index.html: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).send(`Server Error: Web files not found. Please ensure 'npm run build' was successful. (Path: ${indexPath})`);
          }
        }
      });
    });
  }

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong' 
    });
  });

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server is listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    if (!process.env.DB_HOST) {
      console.warn("WARNING: DB_HOST is not set. Database features will be limited.");
    }
  });
}

startServer();
