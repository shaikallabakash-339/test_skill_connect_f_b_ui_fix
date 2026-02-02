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

// Get database tables
router.get('/database-tables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name as name, 
             CASE 
               WHEN table_name = 'users' THEN 'User accounts and profiles'
               WHEN table_name = 'messages' THEN 'User messages and conversations'
               WHEN table_name = 'notifications' THEN 'System notifications'
               WHEN table_name = 'resumes' THEN 'User resume files'
               WHEN table_name = 'donations' THEN 'Donation transactions'
               WHEN table_name = 'user_subscriptions' THEN 'Premium subscriptions'
               WHEN table_name = 'subscription_plans' THEN 'Subscription plan details'
               WHEN table_name = 'old_age_homes' THEN 'Old age home information'
               WHEN table_name = 'orphans' THEN 'Orphanage information'
               ELSE 'System table'
             END as description
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'messages', 'notifications', 'resumes', 'donations', 'user_subscriptions', 'subscription_plans', 'old_age_homes', 'orphans')
      ORDER BY table_name
    `);
    res.json({
      success: true,
      tables: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching database tables:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching database tables',
      error: err.message
    });
  }
});

// Get table data
router.get('/table-data/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const allowedTables = ['users', 'messages', 'notifications', 'resumes', 'donations', 'user_subscriptions', 'subscription_plans', 'old_age_homes', 'orphans'];
    
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table name'
      });
    }

    const result = await pool.query(`SELECT * FROM ${tableName} LIMIT 100`);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching table data:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching table data',
      error: err.message
    });
  }
});

// Upload subscription QR
router.post('/upload-subscription-qr', async (req, res) => {
  try {
    if (!req.files || !req.files.qrImage) {
      return res.status(400).json({
        success: false,
        message: 'No QR image uploaded'
      });
    }

    const { type } = req.body;
    if (!['monthly', 'yearly'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription type'
      });
    }

    const file = req.files.qrImage;
    const fileName = `subscription-qr-${type}-${Date.now()}.png`;
    
    // Upload to MinIO
    const uploadResult = await uploadFile(file, fileName, 'subscription-qrs');
    
    if (uploadResult.success) {
      // Update or insert QR URL
      await pool.query(
        `INSERT INTO subscription_qrs (type, qr_url) 
         VALUES ($1, $2) 
         ON CONFLICT (type) 
         DO UPDATE SET qr_url = EXCLUDED.qr_url, updated_at = NOW()`,
        [type, uploadResult.url]
      );

      res.json({
        success: true,
        message: 'Subscription QR uploaded successfully',
        url: uploadResult.url
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to upload QR image'
      });
    }
  } catch (err) {
    console.error('[v0] Error uploading subscription QR:', err);
    res.status(500).json({
      success: false,
      message: 'Error uploading subscription QR',
      error: err.message
    });
  }
});

// Send announcement
router.post('/send-announcement', async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Insert announcement
    const announcementResult = await pool.query(
      'INSERT INTO announcements (title, message) VALUES ($1, $2) RETURNING id',
      [title, message]
    );

    const announcementId = announcementResult.rows[0].id;

    // Send to all users
    const usersResult = await pool.query('SELECT id FROM users');
    const userIds = usersResult.rows.map(u => u.id);

    for (const userId of userIds) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
        [userId, title, message, 'announcement']
      );
    }

    // Send email notifications via SendPulse
    const emailService = require('../utils/sendpulseService');
    const emails = usersResult.rows.map(u => u.email);
    
    try {
      await emailService.sendAnnouncement(emails, title, message);
    } catch (emailErr) {
      console.error('[v0] Email sending failed:', emailErr);
      // Don't fail the whole request if email fails
    }

    res.json({
      success: true,
      message: 'Announcement sent successfully to all users'
    });
  } catch (err) {
    console.error('[v0] Error sending announcement:', err);
    res.status(500).json({
      success: false,
      message: 'Error sending announcement',
      error: err.message
    });
  }
});

// NEW: Approve subscription request
router.post('/subscriptions/approve/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { adminId } = req.body;

    console.log('[v0] Approving subscription:', subscriptionId);

    const result = await pool.query(`
      UPDATE user_subscriptions 
      SET is_approved = true, status = 'active', approved_by = $1, approved_at = NOW(),
          start_date = NOW(), end_date = NOW() + INTERVAL '30 days'
      WHERE id = $2
      RETURNING user_id, plan_id
    `, [adminId || '00000000-0000-0000-0000-000000000000', subscriptionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const { user_id } = result.rows[0];

    // Update user as premium
    await pool.query('UPDATE users SET is_premium = true WHERE id = $1', [user_id]);

    // Create notification
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, notification_type) VALUES ($1, $2, $3, $4)',
      [user_id, 'Premium Subscription Approved', 'Your premium subscription has been approved! You now have unlimited messaging.', 'subscription_approved']
    );

    res.json({
      success: true,
      message: 'Subscription approved successfully',
      userId: user_id
    });
  } catch (err) {
    console.error('[v0] Error approving subscription:', err);
    res.status(500).json({
      success: false,
      message: 'Error approving subscription',
      error: err.message
    });
  }
});

// NEW: Reject subscription request
router.post('/subscriptions/reject/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason } = req.body;

    console.log('[v0] Rejecting subscription:', subscriptionId);

    const result = await pool.query(`
      UPDATE user_subscriptions 
      SET status = 'rejected', rejection_reason = $1
      WHERE id = $2
      RETURNING user_id
    `, [reason || 'Payment verification failed', subscriptionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const { user_id } = result.rows[0];

    // Create notification
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, notification_type) VALUES ($1, $2, $3, $4)',
      [user_id, 'Subscription Request Rejected', `Your subscription request has been rejected. Reason: ${reason || 'Payment verification failed'}`, 'subscription_rejected']
    );

    res.json({
      success: true,
      message: 'Subscription rejected successfully'
    });
  } catch (err) {
    console.error('[v0] Error rejecting subscription:', err);
    res.status(500).json({
      success: false,
      message: 'Error rejecting subscription',
      error: err.message
    });
  }
});

// NEW: Verify user resumes
router.get('/resumes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.fullname, u.email
      FROM resumes r
      JOIN users u ON r.email = u.email
      ORDER BY r.created_at DESC
    `);

    res.json({
      success: true,
      resumes: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching resumes:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching resumes',
      error: err.message
    });
  }
});

// NEW: Mark user as premium
router.post('/users/mark-premium/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'UPDATE users SET is_premium = true WHERE id = $1 RETURNING id, email',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User marked as premium',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error marking user as premium:', err);
    res.status(500).json({
      success: false,
      message: 'Error marking user as premium',
      error: err.message
    });
  }
});

// NEW: Get notifications statistics
router.get('/notifications-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN NOT is_read THEN 1 ELSE 0 END) as unread,
        notification_type,
        COUNT(*) as count
      FROM notifications
      GROUP BY notification_type
    `);

    res.json({
      success: true,
      stats: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching notification stats:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification statistics',
      error: err.message
    });
  }
});

// NEW: Get all orphanages
router.get('/orphanages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orphans ORDER BY created_at DESC');
    res.json({
      success: true,
      orphanages: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching orphanages:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching orphanages',
      error: err.message
    });
  }
});

// NEW: Add/Update orphanage
router.post('/orphanages', async (req, res) => {
  try {
    const { id, name, description, location, imageUrl, qrUrl, contactEmail, contactPhone } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (id) {
      // Update
      const result = await pool.query(`
        UPDATE orphans 
        SET name = $1, description = $2, location = $3, image_url = $4, qr_url = $5, contact_email = $6, contact_phone = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [name, description, location, imageUrl, qrUrl, contactEmail, contactPhone, id]);

      res.json({ success: true, message: 'Orphanage updated', orphanage: result.rows[0] });
    } else {
      // Create
      const result = await pool.query(`
        INSERT INTO orphans (name, description, location, image_url, qr_url, contact_email, contact_phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [name, description, location, imageUrl, qrUrl, contactEmail, contactPhone]);

      res.json({ success: true, message: 'Orphanage created', orphanage: result.rows[0] });
    }
  } catch (err) {
    console.error('[v0] Error managing orphanage:', err);
    res.status(500).json({
      success: false,
      message: 'Error managing orphanage',
      error: err.message
    });
  }
});

// NEW: Delete orphanage
router.delete('/orphanages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM orphans WHERE id = $1', [id]);
    res.json({ success: true, message: 'Orphanage deleted' });
  } catch (err) {
    console.error('[v0] Error deleting orphanage:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting orphanage',
      error: err.message
    });
  }
});

// NEW: Get all old age homes
router.get('/old-age-homes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM old_age_homes ORDER BY created_at DESC');
    res.json({
      success: true,
      homes: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching old age homes:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching old age homes',
      error: err.message
    });
  }
});

// NEW: Add/Update old age home
router.post('/old-age-homes', async (req, res) => {
  try {
    const { id, name, description, location, imageUrl, qrUrl, contactEmail, contactPhone } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (id) {
      // Update
      const result = await pool.query(`
        UPDATE old_age_homes 
        SET name = $1, description = $2, location = $3, image_url = $4, qr_url = $5, contact_email = $6, contact_phone = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [name, description, location, imageUrl, qrUrl, contactEmail, contactPhone, id]);

      res.json({ success: true, message: 'Old age home updated', home: result.rows[0] });
    } else {
      // Create
      const result = await pool.query(`
        INSERT INTO old_age_homes (name, description, location, image_url, qr_url, contact_email, contact_phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [name, description, location, imageUrl, qrUrl, contactEmail, contactPhone]);

      res.json({ success: true, message: 'Old age home created', home: result.rows[0] });
    }
  } catch (err) {
    console.error('[v0] Error managing old age home:', err);
    res.status(500).json({
      success: false,
      message: 'Error managing old age home',
      error: err.message
    });
  }
});

// NEW: Delete old age home
router.delete('/old-age-homes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM old_age_homes WHERE id = $1', [id]);
    res.json({ success: true, message: 'Old age home deleted' });
  } catch (err) {
    console.error('[v0] Error deleting old age home:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting old age home',
      error: err.message
    });
  }
});

module.exports = router;
