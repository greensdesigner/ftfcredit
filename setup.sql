-- FTF Consulting - Database Setup Script

-- 1. ইউজার টেবিল (Users Table)
CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    fullName VARCHAR(255) NOT NULL,
    role ENUM('client', 'admin') DEFAULT 'client',
    phone VARCHAR(20),
    onboardingStep INT DEFAULT 1,
    plaidConnected BOOLEAN DEFAULT FALSE,
    achAuthorized BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. সাবস্ক্রিপশন টেবিল (Subscriptions Table)
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(128) NOT NULL,
    planName ENUM('Credit Repair', 'Business Funding') NOT NULL,
    status ENUM('active', 'pending', 'failed', 'paused', 'canceled') DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    nextBillingDate DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE CASCADE
);

-- 3. পেমেন্ট রেকর্ড (Payments Table)
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(128) PRIMARY KEY,
    userId VARCHAR(128) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
    paymentType VARCHAR(20) DEFAULT 'ACH',
    paymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE CASCADE
);

-- 4. সার্ভিস প্রগ্রেস (Service Progress Table)
CREATE TABLE IF NOT EXISTS service_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(128) NOT NULL,
    taskName VARCHAR(255) NOT NULL,
    status ENUM('completed', 'in-progress', 'pending') DEFAULT 'pending',
    estimatedCompletion DATE,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE CASCADE
);

-- নমুনা ডাটা (Sample Admin User)
-- INSERT INTO users (uid, email, fullName, role, onboardingStep) 
-- VALUES ('admin_01', 'admin@ftf.com', 'FTF Admin', 'admin', 4);
