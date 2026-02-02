/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { uploadFile, deleteFile, getFileUrl } = require('../utils/minio');
const { sanitizeString } = require('../utils/validation');
const fs = require('fs');

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

// NEW: Get comprehensive dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Total users
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(usersResult.rows[0].total);

    // Users by status
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count FROM users GROUP BY status
    `);
    const usersByStatus = {};
    statusResult.rows.forEach(row => {
      usersByStatus[row.status] = parseInt(row.count);
    });

    // Premium users
    const premiumResult = await pool.query('SELECT COUNT(*) as total FROM users WHERE is_premium = true');
    const premiumUsers = parseInt(premiumResult.rows[0].total);

    // Active conversations
    const conversationsResult = await pool.query('SELECT COUNT(DISTINCT user_id) as total FROM conversations WHERE is_active = true');
    const activeConversations = parseInt(conversationsResult.rows[0].total);

    // Total messages
    const messagesResult = await pool.query('SELECT COUNT(*) as total FROM user_messages');
    const totalMessages = parseInt(messagesResult.rows[0].total);

    // Total donations
    const donationsResult = await pool.query('SELECT COUNT(*) as total, SUM(amount) as totalAmount FROM donations');
    const totalDonations = parseInt(donationsResult.rows[0].total);
    const donationAmount = parseFloat(donationsResult.rows[0].totalamount || 0);

    // Total resumes
    const resumesResult = await pool.query('SELECT COUNT(*) as total FROM resumes');
    const totalResumes = parseInt(resumesResult.rows[0].total);

    // Active subscriptions
    const subscriptionsResult = await pool.query(`
      SELECT COUNT(*) as total FROM user_subscriptions 
      WHERE status = 'active' AND end_date > NOW()
    `);
    const activeSubscriptions = parseInt(subscriptionsResult.rows[0].total);

    res.json({
      success: true,
      stats: {
        totalUsers,
        premiumUsers,
        activeConversations,
        totalMessages,
        totalDonations,
        donationAmount,
        totalResumes,
        activeSubscriptions,
        usersByStatus
      }
    });
  } catch (err) {
    console.error('[v0] Error fetching dashboard stats:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: err.message
    });
  }
});

// NEW: Get user growth over time
router.get('/dashboard/growth', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as newUsers,
        SUM(CASE WHEN is_premium THEN 1 ELSE 0 END) as newPremium
      FROM users
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching growth data:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching growth data'
    });
  }
});

// NEW: Get message statistics
router.get('/dashboard/messages', async (req, res) => {
  try {
    // Messages by category
    const categoryResult = await pool.query(`
      SELECT category, COUNT(*) as count FROM messages GROUP BY category
    `);

    // Message delivery stats
    const deliveryResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read
      FROM user_messages
    `);

    const delivery = deliveryResult.rows[0];

    res.json({
      success: true,
      messagesByCategory: categoryResult.rows,
      deliveryStats: {
        total: parseInt(delivery.total),
        read: parseInt(delivery.read),
        unread: parseInt(delivery.total) - parseInt(delivery.read),
        readPercentage: delivery.total > 0 ? Math.round((parseInt(delivery.read) / parseInt(delivery.total)) * 100) : 0
      }
    });
  } catch (err) {
    console.error('[v0] Error fetching message stats:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching message statistics'
    });
  }
});

// NEW: Get pending subscriptions for approval
router.get('/dashboard/pending-subscriptions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        us.id,
        us.user_id,
        u.email,
        u.fullname,
        sp.name as plan_name,
        sp.price,
        us.payment_screenshot_url,
        us.created_at
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.status = 'pending' OR us.is_approved = false
      ORDER BY us.created_at DESC
    `);

    res.json({
      success: true,
      pending: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching pending subscriptions:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending subscriptions'
    });
  }
});

// NEW: Get donation statistics
router.get('/dashboard/donations', async (req, res) => {
  try {
    // Total donation stats
    const totalsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(amount) as totalAmount,
        AVG(amount) as averageAmount
      FROM donations
    `);

    const totals = totalsResult.rows[0];

    // Donations by category
    const categoryResult = await pool.query(`
      SELECT category, COUNT(*) as count, SUM(amount) as total
      FROM donations
      GROUP BY category
    `);

    res.json({
      success: true,
      totals: {
        count: parseInt(totals.total),
        amount: parseFloat(totals.totalamount || 0),
        average: parseFloat(totals.averageamount || 0)
      },
      byCategory: categoryResult.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching donation stats:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching donation statistics'
    });
  }
});

// NEW: Get company-wise user distribution
router.get('/dashboard/companies', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        company_name,
        COUNT(*) as userCount,
        SUM(CASE WHEN is_premium THEN 1 ELSE 0 END) as premiumCount
      FROM users
      WHERE company_name IS NOT NULL
      GROUP BY company_name
      ORDER BY userCount DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      companies: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching company distribution:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching company distribution'
    });
  }
});

// NEW: Get recent system activities
router.get('/dashboard/recent-activities', async (req, res) => {
  try {
    // Recent users
    const usersResult = await pool.query(`
      SELECT id, email, fullname, status, created_at FROM users
      ORDER BY created_at DESC LIMIT 10
    `);

    // Recent subscriptions
    const subsResult = await pool.query(`
      SELECT us.id, u.email, sp.name as plan, us.created_at
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      JOIN subscription_plans sp ON us.plan_id = sp.id
      ORDER BY us.created_at DESC LIMIT 10
    `);

    // Recent donations
    const donationsResult = await pool.query(`
      SELECT id, donor_name, amount, category, created_at FROM donations
      ORDER BY created_at DESC LIMIT 10
    `);

    res.json({
      success: true,
      recentUsers: usersResult.rows,
      recentSubscriptions: subsResult.rows,
      recentDonations: donationsResult.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching activities:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities'
    });
  }
});

module.exports = router;
