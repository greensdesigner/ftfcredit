import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Stripe lazy init
  let stripe: Stripe | null = null;
  const getStripe = () => {
    if (!stripe && process.env.STRIPE_SECRET_KEY) {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripe;
  };

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Database Connection Configuration (Ready for Hostinger)
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Add charset for better support
    charset: 'utf8mb4'
  };

  let pool: any;

  if (process.env.DB_HOST) {
    try {
      // Check for missing critical variables
      const missingVars = [];
      if (!process.env.DB_USER) missingVars.push("DB_USER");
      if (!process.env.DB_PASSWORD) missingVars.push("DB_PASSWORD");
      if (!process.env.DB_NAME) missingVars.push("DB_NAME");

      if (missingVars.length > 0) {
        console.error(`❌ CRITICAL: Missing environment variables: ${missingVars.join(", ")}`);
        console.warn("Please set these in your application settings.");
      }

      console.log(`Connecting to database: ${process.env.DB_NAME}`);
      console.log(`Endpoint: ${dbConfig.host}:${dbConfig.port}`);
      console.log(`User ID: ${process.env.DB_USER}`);
      
      pool = mysql.createPool(dbConfig);
      
      // Test the connection immediately
      const testConnection = async () => {
        try {
          const connection = await pool.getConnection();
          console.log("✅ Successfully connected to MySQL database pool");
          connection.release();
          await initializeDB();
        } catch (err: any) {
          console.error("❌ Database connection test failed!");
          console.error(`Error Code: ${err.code}`);
          console.error(`Error Message: ${err.message}`);
          
          if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error("💡 TIP: Wrong password or user doesn't have permissions for this database.");
            console.error("💡 ACTION: Check if user 'u322548859_ftfconsult' is assigned to database 'u322548859_ftfcredit' with 'All Privileges' in Hostinger MySQL Databases section.");
          } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
            console.error("💡 TIP: Host is wrong. Hostinger typically uses 'localhost'.");
          }
          
          console.warn("Please verify your DB_HOST, DB_USER, DB_PASSWORD and DB_NAME in your environment settings.");
        }
      };
      
      // Auto-initialize tables if they don't exist
      const initializeDB = async () => {
        try {
          console.log("Initializing database tables...");
          
          // Users table
          await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
              uid VARCHAR(128) PRIMARY KEY,
              email VARCHAR(255) NOT NULL UNIQUE,
              fullName VARCHAR(255) NOT NULL,
              password VARCHAR(255),
              role ENUM('client', 'admin') DEFAULT 'client',
              phone VARCHAR(20),
              avatarUrl LONGTEXT,
              onboardingStep INT DEFAULT 1,
              plaidConnected BOOLEAN DEFAULT FALSE,
              achAuthorized BOOLEAN DEFAULT FALSE,
              streetAddress VARCHAR(255),
              city VARCHAR(100),
              state VARCHAR(100),
              zipCode VARCHAR(20),
              createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // System settings table for platform subscription
          await pool.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
              id INT PRIMARY KEY DEFAULT 1,
              subscriptionStatus ENUM('active', 'expired') DEFAULT 'active',
              expiryDate TIMESTAMP,
              monthlyFee DECIMAL(10, 2) DEFAULT 100.00,
              UNIQUE (id)
            )
          `);

          // Initialize system settings if not exists
          const [settings]: any = await pool.query("SELECT * FROM system_settings WHERE id = 1");
          if (settings.length === 0) {
            const nextMonth = new Date();
            nextMonth.setDate(nextMonth.getDate() + 30);
            await pool.query("INSERT INTO system_settings (id, subscriptionStatus, expiryDate) VALUES (1, 'active', ?)", [nextMonth]);
          }

          // Migrations
          try { await pool.query("ALTER TABLE users ADD COLUMN streetAddress VARCHAR(255)"); } catch (e) {}
          try { await pool.query("ALTER TABLE users ADD COLUMN city VARCHAR(100)"); } catch (e) {}
          try { await pool.query("ALTER TABLE users ADD COLUMN state VARCHAR(100)"); } catch (e) {}
          try { await pool.query("ALTER TABLE users ADD COLUMN zipCode VARCHAR(20)"); } catch (e) {}

          // Helper to add avatarUrl if it doesn't exist (migrations)
          try {
            await pool.query("ALTER TABLE users MODIFY COLUMN avatarUrl LONGTEXT");
          } catch (e) {
            try {
              await pool.query("ALTER TABLE users ADD COLUMN avatarUrl LONGTEXT");
            } catch (innerE) {}
          }

          // Helper to add password if it doesn't exist (migrations)
          try {
            await pool.query("ALTER TABLE users ADD COLUMN password VARCHAR(255)");
          } catch (e) {
            // Probably already exists
          }

          // Subscriptions table
          await pool.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
              id INT AUTO_INCREMENT PRIMARY KEY,
              userId VARCHAR(128) NOT NULL,
              planName VARCHAR(255) NOT NULL,
              status ENUM('active', 'pending', 'failed', 'paused', 'canceled') DEFAULT 'pending',
              amount DECIMAL(10, 2) NOT NULL,
              nextBillingDate DATE,
              createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE KEY unique_user (userId),
              FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE CASCADE
            )
          `);

          // Migrating to VARCHAR if it was ENUM
          try {
            await pool.query("ALTER TABLE subscriptions MODIFY COLUMN planName VARCHAR(255) NOT NULL");
          } catch (e) {}

          // Add unique key if it doesn't exist
          try {
             await pool.query("ALTER TABLE subscriptions ADD UNIQUE KEY unique_user (userId)");
          } catch (e) {}

          // Payments table
          await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
              id VARCHAR(128) PRIMARY KEY,
              userId VARCHAR(128) NOT NULL,
              amount DECIMAL(10, 2) NOT NULL,
              status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
              paymentType VARCHAR(20) DEFAULT 'ACH',
              paymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE CASCADE
            )
          `);

          // Service Progress table
          await pool.query(`
            CREATE TABLE IF NOT EXISTS service_progress (
              id INT AUTO_INCREMENT PRIMARY KEY,
              userId VARCHAR(128) NOT NULL,
              taskName VARCHAR(255) NOT NULL,
              status ENUM('completed', 'in-progress', 'pending') DEFAULT 'pending',
              estimatedCompletion DATE,
              updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE CASCADE
            )
          `);

          console.log("✅ All database tables verified/created successfully.");
        } catch (dbErr: any) {
          console.error("❌ Error initializing tables:", dbErr.message);
          console.warn("If you get access denied here, check if your user has CREATE permissions.");
        }
      };
      testConnection();
      
    } catch (error) {
      console.error("Database connection failed:", error);
    }
  } else {
    console.warn("CRITICAL: DB_HOST environment variable is missing. Database will not work.");
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
    if (!pool) return res.status(500).json({ error: "Database not configured. Check DB environment variables." });
    const { uid, email, fullName, password, role, phone } = req.body;
    try {
      // Check if user exists first to provide better error
      const [existing]: any = await pool.query("SELECT uid FROM users WHERE email = ?", [email]);
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: "A user with this email already exists." });
      }

      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
      const assignedRole = role || 'client';

      await pool.query(
        "INSERT INTO users (uid, email, fullName, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)",
        [uid, email, fullName, hashedPassword, assignedRole, phone]
      );
      console.log(`✅ User created successfully: ${email} (${uid})`);
      res.json({ status: "success", message: "User created in DB" });
    } catch (error: any) {
      console.error(`❌ Signup DB Error for ${email}:`, error.message);
      res.status(500).json({ error: "Database Error: " + error.message });
    }
  });

  // User Login
  app.post("/api/auth/login", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { email, password } = req.body;
    try {
      const [rows]: any = await pool.query(`
        SELECT u.*, s.planName as plan_name, s.status as sub_status, s.amount as sub_amount,
               u.plaidConnected, u.achAuthorized
        FROM users u
        LEFT JOIN subscriptions s ON u.uid = s.userId
        WHERE u.email = ?
      `, [email]);

      if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = rows[0];

      // If user has a password, verify it
      if (user.password) {
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid email or password" });
        }
      } else {
        // This handles users created before password hashing was implemented
        // In a real app, you'd require them to reset password, but here we'll just fail for safety
        return res.status(401).json({ error: "Account requires password setup" });
      }

      console.log(`✅ Login successful: ${email}`);
      res.json({ status: "success", user });
    } catch (error: any) {
      console.error("Login Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Get User Profile
  app.get("/api/users/:uid", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      const [rows]: any = await pool.query(`
        SELECT u.*, s.planName as plan_name, s.status as sub_status, s.amount as sub_amount
        FROM users u
        LEFT JOIN subscriptions s ON u.uid = s.userId
        WHERE u.uid = ?
      `, [req.params.uid]);

      if (rows.length === 0) return res.status(404).json({ error: "User not found" });
      res.json(rows[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update User Profile
  app.patch("/api/users/:uid", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { fullName, phone, avatarUrl, email, streetAddress, city, state, zipCode } = req.body;
    try {
      await pool.query(
        "UPDATE users SET fullName = ?, phone = ?, avatarUrl = ?, email = ?, streetAddress = ?, city = ?, state = ?, zipCode = ? WHERE uid = ?",
        [fullName, phone, avatarUrl, email, streetAddress, city, state, zipCode, req.params.uid]
      );
      res.json({ status: "success", message: "Profile updated" });
    } catch (error: any) {
      console.error("Update Profile Error:", error.message);
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

  // --- System Subscription Management ---
  app.get("/api/admin/system-settings", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      const [rows]: any = await pool.query("SELECT * FROM system_settings WHERE id = 1");
      const settings = rows[0];
      
      // Auto-expire check
      const now = new Date();
      if (settings.expiryDate && new Date(settings.expiryDate) < now && settings.subscriptionStatus === 'active') {
        await pool.query("UPDATE system_settings SET subscriptionStatus = 'expired' WHERE id = 1");
        settings.subscriptionStatus = 'expired';
      }
      
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/system-pay", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      await pool.query(
        "UPDATE system_settings SET subscriptionStatus = 'active', expiryDate = ? WHERE id = 1",
        [nextMonth]
      );
      res.json({ status: "success", message: "Subscription renewed for 30 days" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verify and Process Stripe Payment (Alternative to Webhooks)
  app.post("/api/admin/verify-system-payment", async (req, res) => {
    const stripeInst = getStripe();
    if (!stripeInst) return res.status(500).json({ error: "Stripe not configured" });
    if (!pool) return res.status(500).json({ error: "Database not configured" });

    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Session ID is required" });

    try {
      // Retrieve the session from Stripe
      const session = await stripeInst.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid' && session.metadata?.type === 'system_maintenance') {
        // Update database
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        await pool.query(
          "UPDATE system_settings SET subscriptionStatus = 'active', expiryDate = ? WHERE id = 1",
          [nextMonth]
        );
        return res.json({ status: "success", message: "Subscription activated successfully" });
      } else {
        return res.status(400).json({ error: "Payment not verified or incorrect session type" });
      }
    } catch (error: any) {
      console.error("Verification Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create Stripe Checkout Session for System Payment
  app.post("/api/admin/create-system-checkout", async (req, res) => {
    const stripeInst = getStripe();
    if (!stripeInst) return res.status(500).json({ error: "Stripe not configured. Please add STRIPE_SECRET_KEY to secrets." });

    try {
      const session = await stripeInst.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Platform Maintenance Fee',
                description: '30-day extended access to administrative features',
              },
              unit_amount: 10000, // $100.00
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/admin-portal?tab=billing&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/admin-portal?tab=billing&success=false`,
        metadata: {
          type: 'system_maintenance'
        }
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all clients with their subscriptions
  app.get("/api/admin/clients", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      const [clients]: any = await pool.query(`
        SELECT u.uid, u.email, u.fullName, u.phone, u.avatarUrl, u.role, u.onboardingStep,
               u.streetAddress, u.city, u.state, u.zipCode,
               s.planName as plan_name, s.status as sub_status, s.amount, s.nextBillingDate as next_billing_date
        FROM users u
        LEFT JOIN subscriptions s ON u.uid = s.userId
        WHERE u.role = 'client'
        ORDER BY u.uid DESC
      `);
      res.json(clients);
    } catch (error: any) {
      console.error("Admin Fetch Clients Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Update client onboarding step or metadata (for progress tracking)
  app.patch("/api/admin/clients/:uid", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { onboardingStep } = req.body;
    try {
      await pool.query(
        "UPDATE users SET onboardingStep = ? WHERE uid = ?",
        [onboardingStep, req.params.uid]
      );
      res.json({ status: "success", message: "Client updated" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get User Payments
  app.get("/api/users/:uid/payments", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      const [rows]: any = await pool.query(
        "SELECT * FROM payments WHERE userId = ? ORDER BY paymentDate DESC",
        [req.params.uid]
      );
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create or Update Subscription
  app.post("/api/subscriptions", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { userId, planName, amount, status } = req.body;
    try {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const subStatus = status || 'active';

      await pool.query(
        `INSERT INTO subscriptions (userId, planName, amount, status, nextBillingDate) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE planName = VALUES(planName), amount = VALUES(amount), status = VALUES(status), nextBillingDate = VALUES(nextBillingDate)`,
        [userId, planName, amount, subStatus, nextMonth]
      );
      res.json({ status: "success" });
    } catch (error: any) {
      console.error("Subscription Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  // Auto-detect production mode if dist folder exists or NODE_ENV is set to production
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.resolve(__dirname, "../dist"));

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Using Vite middleware (development)");
    } catch (e) {
      console.warn("Vite not found, falling back to production mode");
      setupProductionMode();
    }
  } else {
    setupProductionMode();
  }

  function setupProductionMode() {
    // Find the correct path for static files (dist)
    let distPath = path.resolve(__dirname, '../dist');
    
    // Fallback search for dist folder
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      const candidates = [
        path.resolve(process.cwd(), 'dist'),
        path.resolve(__dirname, 'dist'),
        path.resolve(__dirname, '..')
      ];
      for (const c of candidates) {
        if (fs.existsSync(path.join(c, 'index.html'))) {
          distPath = c;
          break;
        }
      }
    }

    const indexPath = path.join(distPath, 'index.html');
    console.log(`[Production] Mode Active`);
    console.log(`[Production] Serving assets from: ${distPath}`);
    
    if (!fs.existsSync(indexPath)) {
      console.error(`[CRITICAL ERROR] index.html not found! Path: ${indexPath}`);
    }
    
    // Serve static files
    app.use(express.static(distPath));
    
    // SPA catch-all route
    app.get('*', (req, res) => {
      // API requests should return 404 if not matched
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "API endpoint not found" });
      }

      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`[Error] Failed to send index.html: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).send("Web application web files missing. Please ensure 'npm run build' was successful.");
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
