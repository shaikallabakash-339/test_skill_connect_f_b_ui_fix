const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Get subscription plans
router.get('/plans', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC'
    );
    res.json({
      success: true,
      plans: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching plans:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans',
      error: err.message
    });
  }
});

// Create subscription request
router.post('/request', async (req, res) => {
  try {
    const { user_id, plan_id, payment_screenshot_url, transaction_proof } = req.body;

    if (!user_id || !plan_id || !payment_screenshot_url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    console.log('[v0] Creating subscription request for user:', user_id);

    // Check if user already has active subscription
    const activeCheck = await pool.query(
      'SELECT * FROM user_subscriptions WHERE user_id = $1 AND status IN (\'active\', \'pending\') AND is_approved = true',
      [user_id]
    );

    if (activeCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Create subscription request
    const result = await pool.query(
      `INSERT INTO user_subscriptions (id, user_id, plan_id, payment_screenshot_url, transaction_proof, status)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'pending')
       RETURNING *`,
      [user_id, plan_id, payment_screenshot_url, transaction_proof]
    );

    res.json({
      success: true,
      message: 'Subscription request submitted. Please wait for admin approval.',
      subscription: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error creating subscription:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: err.message
    });
  }
});

// Get user's subscription status
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT us.*, sp.name, sp.price, sp.duration_months, sp.max_conversations
       FROM user_subscriptions us
       LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1
       ORDER BY us.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      subscriptions: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching user subscriptions:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: err.message
    });
  }
});

// Admin: Get pending subscription requests
router.get('/admin/pending', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT us.*, u.email, u.fullname, sp.name, sp.price, sp.duration_months
       FROM user_subscriptions us
       JOIN users u ON us.user_id = u.id
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.status = 'pending' AND us.is_approved = false
       ORDER BY us.created_at DESC`
    );

    res.json({
      success: true,
      requests: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching pending requests:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending requests',
      error: err.message
    });
  }
});

// Admin: Approve subscription
router.post('/admin/approve/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    console.log('[v0] Admin approving subscription:', subscriptionId);

    // Get subscription and plan details
    const subResult = await pool.query(
      `SELECT us.*, sp.duration_months FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.id = $1`,
      [subscriptionId]
    );

    if (subResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const subscription = subResult.rows[0];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + subscription.duration_months);

    // Update subscription
    await pool.query(
      `UPDATE user_subscriptions 
       SET is_approved = true, status = 'active', start_date = $1, end_date = $2, approved_by = $3, approved_at = NOW()
       WHERE id = $4`,
      [startDate, endDate, adminId, subscriptionId]
    );

    // Update user to premium
    await pool.query(
      'UPDATE users SET is_premium = true WHERE id = $1',
      [subscription.user_id]
    );

    // Get user email for notification
    const userResult = await pool.query(
      'SELECT email, fullname FROM users WHERE id = $1',
      [subscription.user_id]
    );

    const user = userResult.rows[0];

    res.json({
      success: true,
      message: 'Subscription approved successfully',
      user_email: user.email,
      end_date: endDate
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

// Admin: Reject subscription
router.post('/admin/reject/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { adminId, reason } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    console.log('[v0] Admin rejecting subscription:', subscriptionId);

    // Get subscription
    const subResult = await pool.query(
      'SELECT user_id, plan_id FROM user_subscriptions WHERE id = $1',
      [subscriptionId]
    );

    if (subResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update subscription
    await pool.query(
      `UPDATE user_subscriptions 
       SET status = 'rejected', rejection_reason = $1, approved_by = $2, approved_at = NOW()
       WHERE id = $3`,
      [reason || 'Rejected by admin', adminId, subscriptionId]
    );

    // Get user email
    const userResult = await pool.query(
      'SELECT email, fullname FROM users WHERE id = $1',
      [subResult.rows[0].user_id]
    );

    res.json({
      success: true,
      message: 'Subscription rejected',
      user_email: userResult.rows[0].email,
      reason: reason
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

// Get all subscriptions
router.get('/admin/all', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT us.*, u.email, u.fullname, sp.name, sp.price
                 FROM user_subscriptions us
                 JOIN users u ON us.user_id = u.id
                 JOIN subscription_plans sp ON us.plan_id = sp.id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND us.status = $' + (params.length + 1);
      params.push(status);
    }

    query += ' ORDER BY us.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      subscriptions: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching subscriptions:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: err.message
    });
  }
});

// NEW: Get subscription plans with pricing
router.get('/plans-detailed', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, price, currency, period, max_conversations, description, is_active
      FROM subscription_plans 
      WHERE is_active = true 
      ORDER BY price ASC
    `);

    res.json({
      success: true,
      plans: result.rows.map(plan => ({
        ...plan,
        priceFormatted: `${plan.currency} ${plan.price}`,
        features: plan.name.includes('Monthly') 
          ? ['Unlimited messaging', 'Priority support'] 
          : ['Unlimited messaging', 'Priority support', 'Annual savings']
      }))
    });
  } catch (err) {
    console.error('[v0] Error fetching plans:', err);
    res.status(500).json({ success: false, message: 'Error fetching plans', error: err.message });
  }
});

// NEW: Upgrade user to premium
router.post('/upgrade', async (req, res) => {
  try {
    const { userId, planId, paymentScreenshotUrl } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Plan ID are required'
      });
    }

    // Verify user exists
    const userResult = await pool.query(
      'SELECT id, email, fullname FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify plan exists
    const planResult = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true',
      [planId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const plan = planResult.rows[0];
    const user = userResult.rows[0];

    // Create subscription record
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (plan.period === 'year' ? 12 : 1));

    const subResult = await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_id, payment_screenshot_url, status, is_approved, start_date, end_date, approved_at)
       VALUES ($1, $2, $3, 'active', true, $4, $5, NOW())
       RETURNING *`,
      [userId, planId, paymentScreenshotUrl, startDate, endDate]
    );

    // Update user to premium
    await pool.query('UPDATE users SET is_premium = true WHERE id = $1', [userId]);

    // Log transaction
    await pool.query(
      `INSERT INTO payment_records (user_id, plan_id, amount, status, screenshot_url, created_at)
       VALUES ($1, $2, $3, 'completed', $4, NOW())`,
      [userId, planId, plan.price, paymentScreenshotUrl]
    );

    res.json({
      success: true,
      message: 'Premium upgrade successful!',
      subscription: {
        id: subResult.rows[0].id,
        plan: plan.name,
        price: plan.price,
        startDate: startDate,
        endDate: endDate,
        userEmail: user.email
      }
    });
  } catch (err) {
    console.error('[v0] Error upgrading to premium:', err);
    res.status(500).json({ success: false, message: 'Error processing upgrade', error: err.message });
  }
});

// NEW: Check if user is premium
router.get('/check-premium/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT us.*, sp.name, sp.price, sp.period
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1 AND us.status = 'active' AND us.end_date > NOW()
       ORDER BY us.end_date DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        isPremium: false,
        message: 'User does not have active premium subscription'
      });
    }

    const subscription = result.rows[0];
    res.json({
      success: true,
      isPremium: true,
      subscription: {
        plan: subscription.name,
        price: subscription.price,
        period: subscription.period,
        endDate: subscription.end_date,
        daysRemaining: Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (err) {
    console.error('[v0] Error checking premium:', err);
    res.status(500).json({ success: false, message: 'Error checking premium status' });
  }
});

// NEW: Cancel premium subscription
router.post('/cancel/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find active subscription
    const subResult = await pool.query(
      'SELECT id FROM user_subscriptions WHERE user_id = $1 AND status = \'active\' LIMIT 1',
      [userId]
    );

    if (subResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No active subscription found' });
    }

    // Cancel subscription (set end date to now)
    await pool.query(
      'UPDATE user_subscriptions SET status = \'cancelled\', end_date = NOW() WHERE id = $1',
      [subResult.rows[0].id]
    );

    // Check if user has other active subscriptions
    const otherSubs = await pool.query(
      'SELECT id FROM user_subscriptions WHERE user_id = $1 AND status = \'active\' AND end_date > NOW()',
      [userId]
    );

    // If no other active subscriptions, remove premium status
    if (otherSubs.rows.length === 0) {
      await pool.query('UPDATE users SET is_premium = false WHERE id = $1', [userId]);
    }

    res.json({ success: true, message: 'Premium subscription cancelled' });
  } catch (err) {
    console.error('[v0] Error cancelling subscription:', err);
    res.status(500).json({ success: false, message: 'Error cancelling subscription' });
  }
});

module.exports = router;
