import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

dotenv.config({ override: true });

// Prevent Node.js crash on unhandled rejections or connection drops
process.on('uncaughtException', (err) => {
  console.error("🚨 UNCAUGHT EXCEPTION PREVENTED CRASH:", err);
});

process.on('unhandledRejection', (reason) => {
  console.error("🚨 UNHANDLED REJECTION PREVENTED CRASH:", reason);
});

const _filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  let pool: any = null;
  let cacheMaintenanceMode = false;

  const fetchMaintenanceMode = async () => {
    if (pool) {
      try {
        const [rows]: any = await pool.query("SELECT maintenanceMode FROM system_settings WHERE id = 1");
        if (rows && rows.length > 0) {
          cacheMaintenanceMode = !!rows[0].maintenanceMode;
        }
      } catch (e) {
        // Fail silent to keep app active if database has transient connection loss
      }
    }
  };

  // Sync maintenance mode status from DB periodically in the background
  const runMaintenanceModeSync = async () => {
    try {
      await fetchMaintenanceMode();
    } catch (e) {
      // Fail-silent
    } finally {
      setTimeout(runMaintenanceModeSync, 15000);
    }
  };
  setTimeout(runMaintenanceModeSync, 15000);

  // Stripe lazy init
  let stripe: Stripe | null = null;
  let lastStripeKeySecret: string | null = null;

  const getStripe = (customSecretKey?: string) => {
    if (customSecretKey) {
      const trimmedCustom = customSecretKey.trim();
      try {
        return new Stripe(trimmedCustom, { apiVersion: '2023-10-16' as any });
      } catch (e: any) {
        console.error("❌ Custom Stripe initialization ERROR:", e.message);
        return null;
      }
    }

    const key = (
      process.env.STRIPE_SECRET_KEY || 
      process.env.VITE_STRIPE_SECRET_KEY ||
      process.env.STRIPE_API_KEY
    )?.trim();
    
    if (!key) {
      console.warn("⚠️ STRIPE_SECRET_KEY is missing from environment. Stripe functionality will fall back to simulation.");
      return null;
    }

    if (!stripe || lastStripeKeySecret !== key) {
      try {
        stripe = new Stripe(key, { apiVersion: '2023-10-16' as any });
        lastStripeKeySecret = key;
        console.log(`✅ Stripe initialized with Secret Key: ${key.substring(0, 15)}...`);
      } catch (e: any) {
        console.error("❌ Stripe initialization ERROR:", e.message);
        return null;
      }
    }
    return stripe;
  };

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Maintenance Mode Cache Middleware
  app.use(async (req, res, next) => {
    const excludedPaths = [
      '/health', 
      '/api/health', 
      '/api/auth/login', 
      '/api/auth/signup', 
      '/api/admin', 
      '/api/admin/system-settings', 
      '/api/stripe/publishable-key',
      '/api/stripe/debug-keys'
    ];
    const isExcluded = excludedPaths.some(p => req.path.startsWith(p));
    
    if (req.path.startsWith('/api/') && !isExcluded) {
      if (cacheMaintenanceMode) {
        return res.status(503).json({ 
          error: "Maintenance Mode", 
          message: "The system is currently undergoing scheduled updates. Please try again shortly." 
        });
      }
    }
    next();
  });

  // Database Connection Configuration (Ready for Hostinger/Cloud SQL)
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
    charset: 'utf8mb4'
  };

  if (process.env.DB_HOST) {
    try {
      console.log(`Connecting to database: ${process.env.DB_NAME} at ${dbConfig.host}:${dbConfig.port}`);
      pool = mysql.createPool(dbConfig);
      
      // Test and initialize
      const initDbConnection = async () => {
        try {
          const connection = await pool.getConnection();
          console.log("✅ Successfully connected to MySQL database pool");
          connection.release();
          await initializeDB();
          await fetchMaintenanceMode();
        } catch (err: any) {
          console.error("❌ Database connection test failed!");
          console.error(`Error Message: ${err.message}`);
        }
      };

      const initializeDB = async () => {
        try {
          console.log("Initializing database tables for user management and billing...");
          
          // Users Table (General auth, tenant, and Stripe info)
          await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
              uid VARCHAR(128) PRIMARY KEY,
              tenantId VARCHAR(128),
              email VARCHAR(255) NOT NULL UNIQUE,
              fullName VARCHAR(255) NOT NULL,
              password VARCHAR(255),
              role ENUM('client', 'admin', 'super_admin') DEFAULT 'client',
              phone VARCHAR(20),
              avatarUrl LONGTEXT,
              onboardingStep INT DEFAULT 1,
              plaidConnected BOOLEAN DEFAULT FALSE,
              achAuthorized BOOLEAN DEFAULT FALSE,
              streetAddress VARCHAR(255),
              city VARCHAR(100),
              state VARCHAR(100),
              zipCode VARCHAR(20),
              agencyName VARCHAR(255),
              stripeAccountId VARCHAR(255),
              stripeCustomerId VARCHAR(255),
              stripePublishableKey VARCHAR(255),
              stripeSecretKey VARCHAR(255),
              isSuspended BOOLEAN DEFAULT FALSE,
              createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // System settings table (Platform subscription, prices & global flags)
          await pool.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
              id INT PRIMARY KEY DEFAULT 1,
              subscriptionStatus ENUM('active', 'expired') DEFAULT 'active',
              expiryDate TIMESTAMP,
              monthlyFee DECIMAL(10, 2) DEFAULT 100.00,
              stripeCustomerId VARCHAR(255),
              stripeSubscriptionId VARCHAR(255),
              maintenanceMode BOOLEAN DEFAULT FALSE,
              emailAlerts BOOLEAN DEFAULT TRUE,
              systemName VARCHAR(255) DEFAULT 'Premium SaaS Hub',
              systemLogo LONGTEXT,
              planPriceStandard DECIMAL(10, 2) DEFAULT 99.00,
              planPricePremium DECIMAL(10, 2) DEFAULT 149.00,
              planPriceElite DECIMAL(10, 2) DEFAULT 299.00,
              UNIQUE (id)
            )
          `);

          // Seed default settings row if missing
          const [settings]: any = await pool.query("SELECT * FROM system_settings WHERE id = 1");
          if (settings.length === 0) {
            const nextMonth = new Date();
            nextMonth.setDate(nextMonth.getDate() + 30);
            await pool.query("INSERT INTO system_settings (id, subscriptionStatus, expiryDate) VALUES (1, 'active', ?)", [nextMonth]);
          }

          // Subscriptions Table
          await pool.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
              id INT AUTO_INCREMENT PRIMARY KEY,
              userId VARCHAR(128) NOT NULL,
              tenantId VARCHAR(128),
              planName VARCHAR(255) NOT NULL,
              status ENUM('active', 'pending', 'failed', 'paused', 'canceled') DEFAULT 'pending',
              amount DECIMAL(10, 2) NOT NULL,
              nextBillingDate DATE,
              createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE KEY unique_user (userId),
              FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE CASCADE
            )
          `);

          // Payments Table (Detailed transactions)
          await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
              id VARCHAR(128) PRIMARY KEY,
              userId VARCHAR(128) NOT NULL,
              amount DECIMAL(10, 2) NOT NULL,
              status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
              paymentType VARCHAR(20) DEFAULT 'CARD',
              paymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE CASCADE
            )
          `);

          // Bypass activation keys table for Admin Gate Access
          await pool.query(`
            CREATE TABLE IF NOT EXISTS activation_keys (
              id INT AUTO_INCREMENT PRIMARY KEY,
              keyCode VARCHAR(100) NOT NULL UNIQUE,
              isUsed BOOLEAN DEFAULT FALSE,
              usedByEmail VARCHAR(255),
              createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              usedAt TIMESTAMP NULL
            )
          `);

          // Seed default activation key if none exist
          const [existingKeys]: any = await pool.query("SELECT * FROM activation_keys");
          if (existingKeys.length === 0) {
            await pool.query("INSERT INTO activation_keys (keyCode) VALUES ('FTF-8899')");
            console.log("🔑 Seeded default admin gate activation key 'FTF-8899'.");
          }

          console.log("✅ Core database tables verified/created successfully.");
        } catch (dbErr: any) {
          console.error("❌ Error initializing tables:", dbErr.message);
        }
      };

      initDbConnection();
    } catch (error) {
      console.error("Database initialization failed:", error);
    }
  } else {
    console.warn("⚠️ DB_HOST environment variable is missing. Running in local simulation mode.");
  }

  // Monitoring Health Check
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

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
      message: "Server is running perfectly",
      database: dbStatus,
      time: new Date().toISOString()
    });
  });

  // Serve publishable stripe key dynamics
  app.get("/api/stripe/publishable-key", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const { tenantId } = req.query;

    if (tenantId && pool) {
      try {
        const [rows]: any = await pool.query("SELECT stripePublishableKey FROM users WHERE uid = ?", [tenantId]);
        const customKey = rows[0]?.stripePublishableKey;
        if (customKey && customKey.trim()) {
          return res.json({ publishableKey: customKey.trim(), isCustom: true });
        }
      } catch (e: any) {
        console.error("Failed to query tenant publishable key:", e.message);
      }
    }

    const key = (process.env.VITE_STRIPE_PUBLISHABLE_KEY || "").trim();
    res.json({ publishableKey: key, isCustom: false });
  });

  // Verify key signatures without disclosing sensitive tokens
  app.get("/api/stripe/debug-keys", (req, res) => {
    const pubKey = (process.env.VITE_STRIPE_PUBLISHABLE_KEY || "").trim();
    const secKey = (
      process.env.STRIPE_SECRET_KEY || 
      process.env.VITE_STRIPE_SECRET_KEY ||
      process.env.STRIPE_API_KEY
    )?.trim() || "";

    res.json({
      publishable: {
        raw: pubKey.substring(0, 15) + "...",
        length: pubKey.length,
        isLive: pubKey.startsWith("pk_live"),
        isTest: pubKey.startsWith("pk_test")
      },
      secret: {
        raw: secKey.substring(0, 15) + "...",
        length: secKey.length,
        isLive: secKey.startsWith("sk_live"),
        isTest: secKey.startsWith("sk_test")
      },
      match: pubKey.length > 0 && secKey.length > 0
    });
  });

  // ------------------ AUTHENTICATION ROUTES ------------------

  // User Signup
  app.post("/api/auth/signup", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured." });
    const { uid, email, fullName, password, role, phone, tenantId: providedTenantId, agencyName, streetAddress, city, state, zipCode } = req.body;
    try {
      const [existing]: any = await pool.query("SELECT uid FROM users WHERE email = ?", [email]);
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: "A user with this email already exists." });
      }

      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
      const assignedRole = role || 'client';
      
      let finalTenantId = providedTenantId;
      if (assignedRole === 'admin') {
        finalTenantId = uid; // Admin owns their tenant
      } else if (assignedRole === 'client' && agencyName) {
        const [admins]: any = await pool.query("SELECT uid FROM users WHERE role = 'admin' AND email = ?", [agencyName]);
        if (admins && admins.length > 0) {
          finalTenantId = admins[0].uid;
        } else {
          return res.status(400).json({ error: "The agency email is not registered. Please use a valid agency administrator email address." });
        }
      }

      await pool.query(
        `INSERT INTO users (uid, email, fullName, password, role, phone, tenantId, agencyName, streetAddress, city, state, zipCode) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uid, email, fullName, hashedPassword, assignedRole, phone, finalTenantId, assignedRole === 'admin' ? agencyName : null, streetAddress, city, state, zipCode]
      );

      console.log(`✅ User registered successfully: ${email} [Tenant: ${finalTenantId}]`);
      res.json({ status: "success", message: "User registered in database", tenantId: finalTenantId });
    } catch (error: any) {
      console.error("Signup Error:", error.message);
      res.status(500).json({ error: "Database Error: " + error.message });
    }
  });

  // User Login
  app.post("/api/auth/login", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { email, password } = req.body;
    try {
      const [rows]: any = await pool.query(`
        SELECT u.*, s.planName as plan_name, s.status as sub_status, s.amount as sub_amount, s.nextBillingDate as sub_expiry
        FROM users u
        LEFT JOIN subscriptions s ON u.uid = s.userId
        WHERE u.email = ?
      `, [email]);

      if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = rows[0];

      if (user.password) {
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid email or password" });
        }
      } else {
        return res.status(401).json({ error: "Account requires password setup" });
      }

      if (user.isSuspended) {
        return res.status(403).json({ error: "Account suspended. Please contact support or clear pending subscription invoices." });
      }

      console.log(`✅ Login successful: ${email}`);
      res.json({ status: "success", user });
    } catch (error: any) {
      console.error("Login Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ------------------ PROFILE CONTROL ------------------

  app.get("/api/users/:uid", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      const [rows]: any = await pool.query(`
        SELECT u.*, s.planName as plan_name, s.status as sub_status, s.amount as sub_amount, s.nextBillingDate as sub_expiry
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

  app.patch("/api/users/:uid", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { fullName, phone, avatarUrl, email, streetAddress, city, state, zipCode } = req.body;
    try {
      await pool.query(
        "UPDATE users SET fullName = ?, phone = ?, avatarUrl = ?, email = ?, streetAddress = ?, city = ?, state = ?, zipCode = ? WHERE uid = ?",
        [fullName, phone, avatarUrl, email, streetAddress, city, state, zipCode, req.params.uid]
      );
      res.json({ status: "success", message: "Profile updated successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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

  // ------------------ SYSTEM MANAGEMENT & CREATOR PORTAL ------------------

  app.get("/api/admin/system-settings", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      const [rows]: any = await pool.query("SELECT * FROM system_settings WHERE id = 1");
      res.json(rows[0] || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/agency-settings/update", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { uid, fullName, agencyName, email, phone, streetAddress, city, state, zipCode } = req.body;
    try {
      await pool.query(
        "UPDATE users SET fullName = ?, agencyName = ?, email = ?, phone = ?, streetAddress = ?, city = ?, state = ?, zipCode = ? WHERE uid = ?",
        [fullName, agencyName, email, phone, streetAddress, city, state, zipCode, uid]
      );
      res.json({ status: "success", message: "Agency settings updated" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/system-settings/update", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { maintenanceMode, emailAlerts, systemName, systemLogo, planPriceStandard, planPricePremium, planPriceElite } = req.body;
    try {
      await pool.query(
        `UPDATE system_settings SET 
           maintenanceMode = ?, 
           emailAlerts = ?, 
           systemName = ?, 
           systemLogo = ?, 
           planPriceStandard = ?, 
           planPricePremium = ?, 
           planPriceElite = ? 
         WHERE id = 1`,
        [
          maintenanceMode === true, 
          emailAlerts === true, 
          systemName || 'SaaS Portal', 
          systemLogo || null,
          planPriceStandard !== undefined ? parseFloat(planPriceStandard) : 99.00,
          planPricePremium !== undefined ? parseFloat(planPricePremium) : 149.00,
          planPriceElite !== undefined ? parseFloat(planPriceElite) : 299.00
        ]
      );
      cacheMaintenanceMode = maintenanceMode === true;
      res.json({ status: "success", message: "System settings updated successfully" });
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
      res.json({ status: "success", message: "Subscription renewed" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/system-expire", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      await pool.query(
        "UPDATE system_settings SET subscriptionStatus = 'expired', expiryDate = NOW() WHERE id = 1"
      );
      res.json({ status: "success", message: "Subscription status forced to expired for lock testing" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Creator Keys
  app.get("/api/creator/keys", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      const [rows]: any = await pool.query("SELECT * FROM activation_keys ORDER BY id DESC");
      res.json({ keys: rows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/creator/users", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      const [rows]: any = await pool.query(`
        SELECT u.uid, u.email, u.fullName, u.role, u.phone, u.agencyName, u.streetAddress, u.city, u.state, u.zipCode, u.isSuspended, u.createdAt, u.tenantId,
               s.amount as sub_amount
        FROM users u
        LEFT JOIN subscriptions s ON u.uid = s.userId
        ORDER BY u.createdAt DESC
      `);
      res.json({ users: rows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/creator/users/update-fee", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { uid, amount } = req.body;
    try {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const [existing]: any = await pool.query("SELECT * FROM subscriptions WHERE userId = ?", [uid]);
      if (existing.length > 0) {
        await pool.query("UPDATE subscriptions SET amount = ? WHERE userId = ?", [amount, uid]);
      } else {
        await pool.query(
          "INSERT INTO subscriptions (userId, planName, amount, status, nextBillingDate) VALUES (?, 'Custom Plan', ?, 'active', ?)",
          [uid, amount, nextMonth]
        );
      }
      res.json({ status: "success", message: "Subscription updated" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/creator/users/toggle-suspension", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { uid, isSuspended } = req.body;
    try {
      await pool.query("UPDATE users SET isSuspended = ? WHERE uid = ?", [isSuspended ? 1 : 0, uid]);
      res.json({ status: "success", message: "User status updated" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/creator/keys/generate", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const keyCode = `FTF-${part1}-${part2}`;
      await pool.query("INSERT INTO activation_keys (keyCode) VALUES (?)", [keyCode]);
      res.json({ status: "success", keyCode });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/creator/keys/delete", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { id } = req.body;
    try {
      await pool.query("DELETE FROM activation_keys WHERE id = ?", [id]);
      res.json({ status: "success" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/verify-gate", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { passcode, email } = req.body;
    try {
      const [rows]: any = await pool.query("SELECT * FROM activation_keys WHERE keyCode = ?", [passcode]);
      if (rows.length === 0) {
        return res.status(400).json({ error: "Access Denied. Signature Mismatch (Invalid Code)." });
      }

      const key = rows[0];
      if (key.isUsed) {
        if (key.usedByEmail === email) {
          return res.json({ status: "success" });
        }
        return res.status(400).json({ error: "Access Denied. This code has already been utilized by another administrator." });
      }

      const now = new Date();
      await pool.query("UPDATE activation_keys SET isUsed = TRUE, usedByEmail = ?, usedAt = ? WHERE id = ?", [email || 'unknown', now, key.id]);
      res.json({ status: "success" });
    } catch (error: any) {
      res.status(500).json({ error: "Server authentication error." });
    }
  });

  // ------------------ STRIPE BILLING SYSTEMS ------------------

  // Checkout Success Verification
  app.post("/api/admin/verify-checkout-session", async (req, res) => {
    const stripeInst = getStripe();
    if (!stripeInst) return res.status(500).json({ error: "Stripe not configured" });
    if (!pool) return res.status(500).json({ error: "Database not configured" });

    const { sessionId } = req.body;
    try {
      const session = await stripeInst.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid' && session.metadata?.type === 'system_maintenance') {
        const subscriptionId = session.subscription as string;
        let expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        if (subscriptionId) {
          const subscription: any = await stripeInst.subscriptions.retrieve(subscriptionId);
          expiryDate = new Date(subscription.current_period_end * 1000);
        }

        await pool.query(
          "UPDATE system_settings SET subscriptionStatus = 'active', expiryDate = ?, stripeSubscriptionId = ? WHERE id = 1",
          [expiryDate, subscriptionId || null]
        );
        res.json({ status: "success" });
      } else {
        res.status(400).json({ error: "Payment not verified" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe Portal Session (For Admin platform bill changes)
  app.post("/api/admin/create-portal-session", async (req, res) => {
    const stripeInst = getStripe();
    if (!stripeInst) return res.status(500).json({ error: "Stripe is not initialized on this server instance." });
    if (!pool) return res.status(500).json({ error: "Database not configured" });

    try {
      const [rows]: any = await pool.query("SELECT stripeCustomerId FROM system_settings WHERE id = 1");
      let customerId = rows[0]?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripeInst.customers.create({
          email: 'admin@platform.com',
          description: 'SaaS Administrator',
        });
        customerId = customer.id;
        await pool.query("UPDATE system_settings SET stripeCustomerId = ? WHERE id = 1", [customerId]);
      }

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

      const session = await stripeInst.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/admin-portal?tab=billing`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe Checkout Session for System Payment
  app.post("/api/admin/create-system-checkout", async (req, res) => {
    const stripeInst = getStripe();
    if (!stripeInst) return res.status(500).json({ error: "Stripe not configured on this environment." });
    if (!pool) return res.status(500).json({ error: "Database not configured" });

    const { adminId } = req.body;
    let amountInCents = 10000;
    let customerEmail = 'admin@platform.com';

    try {
      if (adminId) {
        const [subRows]: any = await pool.query(
          "SELECT s.amount, u.email FROM subscriptions s JOIN users u ON s.userId = u.uid WHERE s.userId = ?",
          [adminId]
        );
        if (subRows.length > 0) {
          amountInCents = Math.round(Number(subRows[0].amount) * 100);
          customerEmail = subRows[0].email || customerEmail;
        }
      }

      const [rows]: any = await pool.query("SELECT stripeCustomerId FROM system_settings WHERE id = 1");
      let customerId = rows[0]?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripeInst.customers.create({
          email: customerEmail,
          description: 'SaaS Platform Owner',
        });
        customerId = customer.id;
        await pool.query("UPDATE system_settings SET stripeCustomerId = ? WHERE id = 1", [customerId]);
      }

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

      const session = await stripeInst.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Platform License Subscription',
                description: 'Full administrative access and platform resources',
              },
              unit_amount: amountInCents,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${baseUrl}/admin-portal?tab=billing&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/admin-portal?tab=billing&success=false`,
        metadata: { type: 'system_maintenance' }
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe status check
  app.get("/api/admin/stripe/status", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { uid } = req.query;
    try {
      const [rows]: any = await pool.query(
        "SELECT stripeAccountId, stripePublishableKey, stripeSecretKey FROM users WHERE uid = ?", 
        [uid]
      );
      if (rows.length === 0) return res.status(404).json({ error: "User not found" });
      
      const stripeAccountId = rows[0]?.stripeAccountId;
      const stripePublishableKey = rows[0]?.stripePublishableKey || "";
      const rawSecret = rows[0]?.stripeSecretKey || "";
      let stripeSecretKey = "";
      if (rawSecret) {
        stripeSecretKey = rawSecret.substring(0, 7) + "••••••••" + rawSecret.substring(Math.max(7, rawSecret.length - 4));
      }
      
      let isConnected = false;
      let isManual = false;
      
      if (stripePublishableKey.trim() && stripeSecretKey.trim()) {
        isConnected = true;
        isManual = true;
      } else if (stripeAccountId) {
        isConnected = stripeAccountId.startsWith('acct_');
        isManual = false;
      }
      
      res.json({ 
        isConnected, 
        stripeAccountId, 
        isManual,
        stripePublishableKey,
        stripeSecretKey,
        hasKeys: !!rawSecret.trim()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update Manual Settings
  app.post("/api/admin/update-settings", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { uid, updates } = req.body;
    if (!uid || !updates) return res.status(400).json({ error: "Missing uid or updates" });
    try {
      const setFields: string[] = [];
      const params: any[] = [];

      if (updates.stripeAccountId !== undefined) {
        setFields.push("stripeAccountId = ?");
        params.push(updates.stripeAccountId);
      }
      if (updates.stripePublishableKey !== undefined) {
        setFields.push("stripePublishableKey = ?");
        params.push(updates.stripePublishableKey);
      }
      if (updates.stripeSecretKey !== undefined && !updates.stripeSecretKey.includes("••••••••")) {
        setFields.push("stripeSecretKey = ?");
        params.push(updates.stripeSecretKey);
      }

      if (setFields.length > 0) {
        params.push(uid);
        await pool.query(`UPDATE users SET ${setFields.join(", ")} WHERE uid = ?`, params);
        return res.json({ status: "success", message: "Stripe keys registered" });
      }
      res.status(400).json({ error: "No changes detected" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Direct Stripe standard Connect onboarding
  app.post("/api/admin/stripe/onboard", async (req, res) => {
    const stripeInst = getStripe();
    if (!stripeInst) return res.status(500).json({ error: "Stripe keys not loaded" });
    if (!pool) return res.status(500).json({ error: "Database not configured" });

    const { uid, email } = req.body;
    try {
      const [rows]: any = await pool.query("SELECT stripeAccountId FROM users WHERE uid = ?", [uid]);
      let stripeAccountId = rows[0]?.stripeAccountId;

      if (!stripeAccountId) {
        const account = await stripeInst.accounts.create({
          type: 'standard', 
          email,
        });
        stripeAccountId = account.id;
        await pool.query("UPDATE users SET stripeAccountId = ? WHERE uid = ?", [stripeAccountId, uid]);
      }

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

      const accountLink = await stripeInst.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${baseUrl}/admin-portal?tab=settings`,
        return_url: `${baseUrl}/admin-portal?tab=settings`,
        type: 'account_onboarding',
      });

      res.json({ url: accountLink.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Client Credit Card Setup Intent
  app.post("/api/client/create-setup-intent", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { uid, email, tenantId } = req.body;

    let tenantSecretKey: string | undefined;
    if (tenantId) {
      try {
        const [admins]: any = await pool.query("SELECT stripeSecretKey FROM users WHERE uid = ?", [tenantId]);
        if (admins[0]?.stripeSecretKey && admins[0]?.stripeSecretKey.trim()) {
          tenantSecretKey = admins[0].stripeSecretKey.trim();
        }
      } catch (e: any) {
        console.error("Failed to fetch tenant custom secret key:", e.message);
      }
    }

    const stripeInst = getStripe(tenantSecretKey);
    if (!stripeInst) return res.status(500).json({ error: "Stripe keys are missing or uninitialized on the server." });

    try {
      const [rows]: any = await pool.query("SELECT stripeCustomerId FROM users WHERE uid = ?", [uid]);
      let stripeCustomerId = rows[0]?.stripeCustomerId;

      let customerExists = false;
      if (stripeCustomerId) {
        try {
          await stripeInst.customers.retrieve(stripeCustomerId);
          customerExists = true;
        } catch (e) {
          customerExists = false;
        }
      }

      if (!stripeCustomerId || !customerExists) {
        const customer = await stripeInst.customers.create({ email, metadata: { userId: uid } });
        stripeCustomerId = customer.id;
        await pool.query("UPDATE users SET stripeCustomerId = ? WHERE uid = ?", [stripeCustomerId, uid]);
      }

      const setupIntent = await stripeInst.setupIntents.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
      });

      res.json({ clientSecret: setupIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get Client Registered Cards/Banks
  app.get("/api/client/payment-methods/:uid", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    try {
      const [rows]: any = await pool.query("SELECT stripeCustomerId, tenantId FROM users WHERE uid = ?", [req.params.uid]);
      const customerId = rows[0]?.stripeCustomerId;
      const tenantId = rows[0]?.tenantId;
      if (!customerId) return res.json([]);

      let tenantSecretKey: string | undefined;
      if (tenantId) {
        const [admins]: any = await pool.query("SELECT stripeSecretKey FROM users WHERE uid = ?", [tenantId]);
        if (admins[0]?.stripeSecretKey && admins[0]?.stripeSecretKey.trim()) {
          tenantSecretKey = admins[0].stripeSecretKey.trim();
        }
      }

      const stripeInst = getStripe(tenantSecretKey);
      if (!stripeInst) return res.status(500).json({ error: "Stripe not configured" });

      const paymentMethods = await stripeInst.paymentMethods.list({ customer: customerId, type: 'card' });
      
      let bankSources: any = { data: [] };
      try {
        bankSources = await stripeInst.customers.listSources(customerId, { object: 'bank_account' });
      } catch (e) {}

      const formatted = [
        ...paymentMethods.data.map((pm: any) => ({
          id: pm.id,
          type: 'card',
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          name: pm.billing_details?.name || 'Card'
        })),
        ...bankSources.data.map((bank: any) => ({
          id: bank.id,
          type: 'bank',
          brand: bank.bank_name || 'Bank Account',
          last4: bank.last4,
          name: bank.account_holder_name || 'ACH Account'
        }))
      ];

      res.json(formatted);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Connect Bank via ACH Routing Numbers & Charge
  app.post("/api/client/connect-bank-ach", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { userId, email, tenantId, token, amount, planName } = req.body;

    if (!token) return res.status(400).json({ error: "Stripe Bank Account Token required" });

    let tenantSecretKey: string | undefined;
    if (tenantId) {
      const [admins]: any = await pool.query("SELECT stripeSecretKey FROM users WHERE uid = ?", [tenantId]);
      if (admins[0]?.stripeSecretKey && admins[0]?.stripeSecretKey.trim()) {
        tenantSecretKey = admins[0].stripeSecretKey.trim();
      }
    }

    const stripeInst = getStripe(tenantSecretKey);
    if (!stripeInst) return res.status(500).json({ error: "Stripe server uninitialized" });

    try {
      const [rows]: any = await pool.query("SELECT stripeCustomerId FROM users WHERE uid = ?", [userId]);
      let stripeCustomerId = rows[0]?.stripeCustomerId;

      let customerExists = false;
      if (stripeCustomerId) {
        try {
          await stripeInst.customers.retrieve(stripeCustomerId);
          customerExists = true;
        } catch (e) {
          customerExists = false;
        }
      }

      if (!stripeCustomerId || !customerExists) {
        const customer = await stripeInst.customers.create({ email, metadata: { userId } });
        stripeCustomerId = customer.id;
        await pool.query("UPDATE users SET stripeCustomerId = ? WHERE uid = ?", [stripeCustomerId, userId]);
      }

      const bankSource = (await stripeInst.customers.createSource(stripeCustomerId, { source: token })) as any;

      const paymentIntent = await stripeInst.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        customer: stripeCustomerId,
        payment_method: bankSource.id,
        confirm: true,
        off_session: true,
        metadata: { userId, planName, paymentType: 'ACH_BANK' }
      } as any);

      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      
      await pool.query(
        `INSERT INTO subscriptions (userId, planName, amount, status, nextBillingDate, tenantId) 
         VALUES (?, ?, ?, 'active', ?, ?)
         ON DUPLICATE KEY UPDATE planName = VALUES(planName), amount = VALUES(amount), status = 'active', nextBillingDate = VALUES(nextBillingDate)`,
        [userId, planName, amount, nextMonth, tenantId]
      );

      await pool.query(
        "INSERT INTO payments (id, userId, amount, status, paymentType) VALUES (?, ?, ?, 'success', 'ACH')",
        [paymentIntent.id, userId, amount]
      );

      res.json({ 
        status: "success", 
        paymentIntentId: paymentIntent.id,
        bankName: bankSource.bank_name || 'Bank Account',
        last4: bankSource.last4,
        paymentStatus: paymentIntent.status
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Standard Plan Subscription Charge
  app.post("/api/client/subscribe-connect", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { userId, planName, amount, paymentMethodId, tenantId } = req.body;
    try {
      const [admins]: any = await pool.query("SELECT stripeAccountId, stripeSecretKey FROM users WHERE uid = ?", [tenantId]);
      const destinationAccount = admins[0]?.stripeAccountId;
      const tenantSecretKey = admins[0]?.stripeSecretKey?.trim() || undefined;

      const stripeInst = getStripe(tenantSecretKey);
      if (!stripeInst) return res.status(500).json({ error: "Stripe not initialized" });

      const [clients]: any = await pool.query("SELECT stripeCustomerId FROM users WHERE uid = ?", [userId]);
      const customerId = clients[0]?.stripeCustomerId;

      let paymentIntent;

      if (tenantSecretKey) {
        paymentIntent = await stripeInst.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'usd',
          customer: customerId,
          payment_method: paymentMethodId,
          off_session: true,
          confirm: true,
          metadata: { userId, planName }
        });
      } else if (destinationAccount && destinationAccount.startsWith('acct_')) {
        try {
          paymentIntent = await stripeInst.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            customer: customerId,
            payment_method: paymentMethodId,
            off_session: true,
            confirm: true,
            transfer_data: { destination: destinationAccount },
            metadata: { userId, planName }
          });
        } catch (e) {
          paymentIntent = await stripeInst.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            customer: customerId,
            payment_method: paymentMethodId,
            off_session: true,
            confirm: true,
            metadata: { userId, planName }
          });
        }
      } else {
        paymentIntent = await stripeInst.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'usd',
          customer: customerId,
          payment_method: paymentMethodId,
          off_session: true,
          confirm: true,
          metadata: { userId, planName }
        });
      }

      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      
      await pool.query(
        `INSERT INTO subscriptions (userId, planName, amount, status, nextBillingDate, tenantId) 
         VALUES (?, ?, ?, 'active', ?, ?)
         ON DUPLICATE KEY UPDATE planName = VALUES(planName), amount = VALUES(amount), status = 'active', nextBillingDate = VALUES(nextBillingDate)`,
        [userId, planName, amount, nextMonth, tenantId]
      );

      await pool.query(
        "INSERT INTO payments (id, userId, amount, status, paymentType) VALUES (?, ?, ?, 'success', 'CARD')",
        [paymentIntent.id, userId, amount]
      );

      res.json({ status: "success", paymentIntentId: paymentIntent.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get Admin's Connected Clients (Isolated by tenant)
  app.get("/api/admin/clients", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { tenantId } = req.query;

    if (!tenantId) return res.status(400).json({ error: "Tenant ID required" });

    try {
      const [clients]: any = await pool.query(`
        SELECT u.uid, u.email, u.fullName, u.phone, u.avatarUrl, u.role, u.onboardingStep,
               u.streetAddress, u.city, u.state, u.zipCode, u.tenantId,
               s.planName as plan_name, s.status as sub_status, s.amount, s.nextBillingDate as next_billing_date
        FROM users u
        LEFT JOIN subscriptions s ON u.uid = s.userId
        WHERE u.role = 'client' AND u.tenantId = ?
        ORDER BY u.uid DESC
      `, [tenantId]);
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/clients/:uid", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not configured" });
    const { onboardingStep } = req.body;
    try {
      await pool.query(
        "UPDATE users SET onboardingStep = ? WHERE uid = ?",
        [onboardingStep, req.params.uid]
      );
      res.json({ status: "success", message: "Client profile step updated" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch Payment Logs
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

  // Admin and Creator direct database update endpoint
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
      res.status(500).json({ error: error.message });
    }
  });

  // ------------------ STATIC FRONTEND SERVER SETUP ------------------

  const isProduction = process.env.NODE_ENV !== "development";

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Using dynamic Vite asset compilers...");
    } catch (e) {
      setupProductionMode();
    }
  } else {
    setupProductionMode();
  }

  function setupProductionMode() {
    let distPath = path.resolve(_dirname, '../dist');
    
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      const candidates = [
        path.resolve(process.cwd(), 'dist'),
        path.resolve(_dirname, 'dist'),
        path.resolve(_dirname, '..')
      ];
      for (const c of candidates) {
        if (fs.existsSync(path.join(c, 'index.html'))) {
          distPath = c;
          break;
        }
      }
    }

    const indexPath = path.join(distPath, 'index.html');
    console.log(`[Production Asset Server] Binding to: ${distPath}`);
    
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "Endpoint not found" });
      }

      res.sendFile(indexPath, (err) => {
        if (err && !res.headersSent) {
          res.status(500).send("Web build is missing. Recompile to resolve.");
        }
      });
    });
  }

  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Internal Server Error Boundary:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong' 
    });
  });

  const portToListen = (!isNaN(Number(PORT)) && isFinite(Number(PORT))) ? Number(PORT) : PORT;
  app.listen(portToListen, () => {
    console.log(`🚀 Premium SaaS Boilerplate server listening on port: ${portToListen}`);
  });
}

startServer();
