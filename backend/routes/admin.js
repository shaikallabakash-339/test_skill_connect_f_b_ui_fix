/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// backend/routes/upload.js
const express = require("express");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const pool = require("../config/db");
require("dotenv").config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Ensures https://api.cloudinary.com
});

// Test Cloudinary config
router.get("/test-cloudinary", (req, res) => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET ||
    !process.env.CLOUDINARY_UPLOAD_PRESET
  ) {
    return res.status(500).json({
      success: false,
      message: "Cloudinary not configured",
      details: {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET,
        upload_preset: !!process.env.CLOUDINARY_UPLOAD_PRESET,
      },
    });
  }
  res.json({
    success: true,
    config: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    },
  });
});

// Upload QR code (with optional home image)
router.post("/upload-qr", async (req, res) => {
  try {
    console.log("Upload QR request:", {
      body: req.body,
      files: req.files ? Object.keys(req.files) : "No files",
      fileDetails: req.files
        ? {
            qrImage: req.files.qrImage
              ? { name: req.files.qrImage.name, size: req.files.qrImage.size, tempFilePath: req.files.qrImage.tempFilePath }
              : null,
            homeImage: req.files.homeImage
              ? { name: req.files.homeImage.name, size: req.files.homeImage.size, tempFilePath: req.files.homeImage.tempFilePath }
              : null,
          }
        : null,
    });

    const { name, type } = req.body;
    const qrImage = req.files?.qrImage;
    const homeImage = req.files?.homeImage; // Optional

    // Validate inputs
    if (!qrImage || !name || !type) {
      return res.status(400).json({ success: false, message: "Missing name, type, or QR image" });
    }
    if (!["old-age", "orphan"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }
    if (!process.env.CLOUDINARY_UPLOAD_PRESET) {
      return res.status(500).json({ success: false, message: "Cloudinary upload preset not configured" });
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(qrImage.mimetype)) {
      return res.status(400).json({ success: false, message: "QR image must be JPEG or PNG" });
    }
    if (qrImage.size === 0) {
      return res.status(400).json({ success: false, message: "QR image is empty" });
    }
    if (homeImage && !allowedTypes.includes(homeImage.mimetype)) {
      return res.status(400).json({ success: false, message: "Home image must be JPEG or PNG" });
    }
    if (homeImage && homeImage.size === 0) {
      return res.status(400).json({ success: false, message: "Home image is empty" });
    }

    // Read QR image from temp file
    if (!fs.existsSync(qrImage.tempFilePath)) {
      return res.status(500).json({ success: false, message: "QR temp file not found" });
    }
    const qrBuffer = fs.readFileSync(qrImage.tempFilePath);

    // Upload QR image to Cloudinary
    const qrResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: type === "old-age" ? "donations/old_age_homes" : "donations/orphans",
          resource_type: "image",
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          public_id: `${name.replace(/\s+/g, "_").toLowerCase()}_qr_${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary QR upload error:", error);
            reject(error);
          } else {
            console.log("Cloudinary QR upload success:", { secure_url: result.secure_url });
            resolve(result);
          }
        }
      ).end(qrBuffer);
    });

    // Upload optional home image
    let homeUrl = null;
    if (homeImage) {
      if (!fs.existsSync(homeImage.tempFilePath)) {
        return res.status(500).json({ success: false, message: "Home temp file not found" });
      }
      const homeBuffer = fs.readFileSync(homeImage.tempFilePath);
      const homeResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: type === "old-age" ? "donations/old_age_homes" : "donations/orphans",
            resource_type: "image",
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            public_id: `${name.replace(/\s+/g, "_").toLowerCase()}_home_${Date.now()}`,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary home image upload error:", error);
              reject(error);
            } else {
              console.log("Cloudinary home image upload success:", { secure_url: result.secure_url });
              resolve(result);
            }
          }
        ).end(homeBuffer);
      });
      homeUrl = homeResult.secure_url;
    }

    // Save to CockroachDB
    const table = type === "old-age" ? "old_age_homes" : "orphans";
    const checkQuery = `SELECT id FROM ${table} WHERE name = $1`;
    const checkResult = await pool.query(checkQuery, [name]);
    
    let query;
    let dbResult;
    if (checkResult.rows.length > 0) {
      query = `
        UPDATE ${table}
        SET qr_url = $1, home_url = $2
        WHERE name = $3
        RETURNING *
      `;
      dbResult = await pool.query(query, [qrResult.secure_url, homeUrl, name]);
    } else {
      query = `
        INSERT INTO ${table} (id, name, qr_url, home_url)
        VALUES (uuid_generate_v4(), $1, $2, $3)
        RETURNING *
      `;
      dbResult = await pool.query(query, [name, qrResult.secure_url, homeUrl]);
    }

    res.json({ success: true, data: dbResult.rows[0] });
  } catch (err) {
    console.error("Upload QR error:", err);
    res.status(500).json({ success: false, message: "Failed to upload QR", error: err.message });
  }
});

// Upload transaction screenshot
router.post("/upload-transaction", async (req, res) => {
  try {
    console.log("Transaction request:", {
      body: req.body,
      files: req.files
        ? {
            screenshot: req.files.screenshot
              ? { name: req.files.screenshot.name, size: req.files.screenshot.size, tempFilePath: req.files.screenshot.tempFilePath }
              : null,
          }
        : "No files",
    });
    const { type, item_id, item_name, amount, name, email, phone } = req.body;
    const screenshot = req.files?.screenshot;

    if (!screenshot || !type || !item_id || !item_name || !amount || !name || !email || !phone) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    if (!["old-age", "orphan"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }
    if (!["image/jpeg", "image/png"].includes(screenshot.mimetype)) {
      return res.status(400).json({ success: false, message: "Screenshot must be JPEG or PNG" });
    }
    if (screenshot.size === 0) {
      return res.status(400).json({ success: false, message: "Screenshot is empty" });
    }

    if (!fs.existsSync(screenshot.tempFilePath)) {
      return res.status(500).json({ success: false, message: "Screenshot temp file not found" });
    }
    const screenshotBuffer = fs.readFileSync(screenshot.tempFilePath);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "donations/transactions",
          resource_type: "image",
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          public_id: `transaction_${item_id}_${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary transaction upload error:", error);
            reject(error);
          } else {
            console.log("Cloudinary transaction upload success:", { secure_url: result.secure_url });
            resolve(result);
          }
        }
      ).end(screenshotBuffer);
    });

    const query = `
      INSERT INTO transactions (id, type, item_id, item_name, amount, name, email, phone, screenshot_url, created_at)
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    const dbResult = await pool.query(query, [type, item_id, item_name, amount, name, email, phone, result.secure_url]);
    res.json({ success: true, data: dbResult.rows[0] });
  } catch (err) {
    console.error("Transaction upload error:", err);
    res.status(500).json({ success: false, message: "Error uploading transaction", error: err.message });
  }
});

// Get old age homes
router.get("/old-age-homes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM old_age_homes");
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (err) {
    console.error("Error fetching old age homes:", err);
    res.status(500).json({ success: false, message: "Error fetching old age homes", error: err.message });
  }
});

// Get orphans
router.get("/orphans", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orphans");
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (err) {
    console.error("Error fetching orphans:", err);
    res.status(500).json({ success: false, message: "Error fetching orphans", error: err.message });
  }
});

// Get transactions
router.get("/transactions", async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) {
      return res.status(400).json({ success: false, message: "Type is required" });
    }
    const query = "SELECT * FROM transactions WHERE type = $1 ORDER BY created_at DESC";
    const result = await pool.query(query, [type]);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total_amount: result.rows.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
    });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ success: false, message: "Error fetching transactions", error: err.message });
  }
});

// Get old age homes stats (daily totals)
router.get("/old-age-homes-stats", async (req, res) => {
  try {
    const query = `
      SELECT 
        t.item_name,
        DATE(t.created_at) AS date,
        SUM(CAST(t.amount AS DECIMAL)) AS total_amount
      FROM transactions t
      WHERE t.type = 'old-age'
        AND DATE(t.created_at) IN (CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day')
      GROUP BY t.item_name, DATE(t.created_at)
      ORDER BY t.item_name, DATE(t.created_at) DESC
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching old age homes stats:", err);
    res.status(500).json({ success: false, message: "Error fetching old age homes stats", error: err.message });
  }
});

// Get orphans stats (daily totals)
router.get("/orphans-stats", async (req, res) => {
  try {
    const query = `
      SELECT 
        t.item_name,
        DATE(t.created_at) AS date,
        SUM(CAST(t.amount AS DECIMAL)) AS total_amount
      FROM transactions t
      WHERE t.type = 'orphan'
        AND DATE(t.created_at) IN (CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day')
      GROUP BY t.item_name, DATE(t.created_at)
      ORDER BY t.item_name, DATE(t.created_at) DESC
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching orphans stats:", err);
    res.status(500).json({ success: false, message: "Error fetching orphans stats", error: err.message });
  }
});

// Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('[v0] Admin login attempt:', email);
    
    // TODO: Implement admin user table and authentication
    // For now, use hardcoded admin credentials
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@skillconnect.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      res.json({
        success: true,
        message: 'Admin login successful',
        admin: {
          email: email,
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }
  } catch (err) {
    console.error('[v0] Admin login error:', err);
    res.status(500).json({
      success: false,
      message: 'Admin login failed',
      error: err.message
    });
  }
});

// Get all users with filters
router.get("/users", async (req, res) => {
  try {
    const { status, company, search } = req.query;
    let query = 'SELECT id, email, fullname, company, status, phone, city, created_at FROM users WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    if (company) {
      query += ' AND company ILIKE $' + (params.length + 1);
      params.push(`%${company}%`);
    }

    if (search) {
      query += ' AND (fullname ILIKE $' + (params.length + 1) + ' OR email ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT 1000';

    const result = await pool.query(query, params);
    res.json({
      success: true,
      users: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching users:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: err.message
    });
  }
});

// Send bulk message to users
router.post("/send-bulk-message", async (req, res) => {
  try {
    const { title, message, category, target_users } = req.body;

    if (!title || !message || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, message, category'
      });
    }

    console.log('[v0] Sending bulk message to category:', category);

    // Insert message
    const messageQuery = `
      INSERT INTO messages (id, category, message, message_type, target_users, timestamp)
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const messageResult = await pool.query(messageQuery, [
      category,
      message,
      'bulk',
      target_users || 0
    ]);

    const msgId = messageResult.rows[0].id;

    // Get all users in this category
    const usersQuery = 'SELECT id FROM users WHERE status = $1';
    const usersResult = await pool.query(usersQuery, [category]);

    // Create message_recipients entries
    let recipientCount = 0;
    for (const user of usersResult.rows) {
      await pool.query(
        'INSERT INTO message_recipients (id, message_id, user_id, is_read) VALUES (uuid_generate_v4(), $1, $2, false)',
        [msgId, user.id]
      );
      recipientCount++;
    }

    console.log('[v0] Bulk message sent to', recipientCount, 'users');

    res.json({
      success: true,
      message: `Message sent to ${recipientCount} users`,
      messageId: msgId,
      recipientCount: recipientCount
    });
  } catch (err) {
    console.error('[v0] Error sending bulk message:', err);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk message',
      error: err.message
    });
  }
});

// Get all donations
router.get("/donations", async (req, res) => {
  try {
    const { type, from_date, to_date } = req.query;
    let query = 'SELECT * FROM donations WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = $' + (params.length + 1);
      params.push(type);
    }

    if (from_date) {
      query += ' AND created_at >= $' + (params.length + 1);
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND created_at <= $' + (params.length + 1);
      params.push(to_date);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    // Calculate totals
    const totalAmount = result.rows.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    res.json({
      success: true,
      donations: result.rows,
      count: result.rows.length,
      totalAmount: totalAmount
    });
  } catch (err) {
    console.error('[v0] Error fetching donations:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching donations',
      error: err.message
    });
  }
});

// Get dashboard analytics
router.get("/analytics", async (req, res) => {
  try {
    // Total users
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Users by status
    const statusResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM users GROUP BY status'
    );

    // Total messages sent
    const messagesResult = await pool.query(
      'SELECT COUNT(*) as count FROM messages'
    );
    const totalMessages = parseInt(messagesResult.rows[0].count);

    // Total donations
    const donationsResult = await pool.query(
      'SELECT SUM(CAST(amount AS DECIMAL)) as total FROM donations'
    );
    const totalDonations = parseFloat(donationsResult.rows[0].total) || 0;

    // Email stats
    const emailResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM email_logs GROUP BY status'
    );

    res.json({
      success: true,
      analytics: {
        totalUsers,
        usersByStatus: statusResult.rows,
        totalMessages,
        totalDonations,
        emailStats: emailResult.rows
      }
    });
  } catch (err) {
    console.error('[v0] Error fetching analytics:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: err.message
    });
  }
});

// Get email statistics
router.get("/email-stats", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT year, month, total_emails_sent, unique_recipients FROM email_statistics ORDER BY year DESC, month DESC'
    );

    res.json({
      success: true,
      stats: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching email stats:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching email statistics',
      error: err.message
    });
  }
});

// Get recent activities
router.get("/activities", async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    
    // Get recent user registrations
    const usersResult = await pool.query(
      'SELECT id, email, fullname, created_at FROM users ORDER BY created_at DESC LIMIT $1',
      [limit]
    );

    // Get recent donations
    const donationsResult = await pool.query(
      'SELECT * FROM donations ORDER BY created_at DESC LIMIT $1',
      [limit]
    );

    // Get recent messages
    const messagesResult = await pool.query(
      'SELECT * FROM messages ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );

    res.json({
      success: true,
      activities: {
        recentUsers: usersResult.rows,
        recentDonations: donationsResult.rows,
        recentMessages: messagesResult.rows
      }
    });
  } catch (err) {
    console.error('[v0] Error fetching activities:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: err.message
    });
  }
});

module.exports = router;
