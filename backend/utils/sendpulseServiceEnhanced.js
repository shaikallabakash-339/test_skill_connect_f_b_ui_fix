/*
 * Enhanced SendPulse Email Service
 * Supports batch sending with user limit (300) and email limit (12,000)
 */

const axios = require('axios');
const { pool } = require('../config/database');

const SENDPULSE_API_URL = 'https://api.sendpulse.com/';
const MAX_USERS = 300;
const MAX_EMAILS = 12000;

// Mock SendPulse implementation (replace with real API)
class SendPulseService {
  constructor() {
    this.emailsSent = 0;
    this.usersSent = 0;
  }

  async getAccountStats() {
    try {
      // In production, call SendPulse API
      const stats = await pool.query(`
        SELECT COUNT(*) as total_sent FROM email_logs 
        WHERE service = 'sendpulse' AND created_at > NOW() - INTERVAL '1 month'
      `);
      return stats.rows[0];
    } catch (err) {
      console.error('[v0] Error getting SendPulse stats:', err);
      return { total_sent: 0 };
    }
  }

  async canSendEmails(recipientCount) {
    // Check user limit
    if (recipientCount > MAX_USERS) {
      console.warn(`[v0] Recipient count ${recipientCount} exceeds max ${MAX_USERS}. Will send to first ${MAX_USERS}.`);
      return MAX_USERS;
    }

    // Check email limit (simplified - in production use actual SendPulse API)
    const stats = await this.getAccountStats();
    const remainingEmails = MAX_EMAILS - (stats.total_sent || 0);
    
    if (remainingEmails <= 0) {
      console.error('[v0] Email limit exceeded for this month');
      return 0;
    }

    return Math.min(recipientCount, remainingEmails);
  }

  async sendEmail(toEmail, subject, htmlContent, textContent = '') {
    try {
      // Log to database
      await pool.query(`
        INSERT INTO email_logs (recipient_email, subject, body, service, status)
        VALUES ($1, $2, $3, 'sendpulse', 'sent')
      `, [toEmail, subject, htmlContent]);

      console.log(`[v0] Email sent to ${toEmail}`);
      return { success: true, email: toEmail };
    } catch (err) {
      console.error('[v0] Error sending email:', err);
      return { success: false, error: err.message };
    }
  }

  async sendBulkEmails(recipients, subject, htmlContent) {
    // Limit to MAX_USERS
    const limitedRecipients = recipients.slice(0, MAX_USERS);
    
    console.log(`[v0] Sending bulk emails to ${limitedRecipients.length} users (limit: ${MAX_USERS})`);

    const results = [];
    for (const recipient of limitedRecipients) {
      const result = await this.sendEmail(recipient.email, subject, htmlContent);
      results.push(result);
    }

    return {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }

  async sendAdminMessage(userEmail, category, message) {
    const subject = `Message from Skill Connect - ${category}`;
    const htmlContent = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>New Message from Admin</h2>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr />
        <p><small>This message was sent from Skill Connect Admin Panel</small></p>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, htmlContent);
  }

  async sendWelcomeEmail(email, fullname) {
    const subject = '🎉 Welcome to Skill Connect - Professional Networking Platform!';
    const htmlContent = `
      <div style="font-family: Arial; background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4f46e5; margin: 0;">Skill Connect</h1>
            <p style="color: #999; font-size: 14px;">Professional Networking Platform</p>
          </div>

          <h2 style="color: #1e293b; margin-bottom: 20px;">Welcome, ${fullname}! 👋</h2>

          <p style="color: #64748b; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining <strong>Skill Connect</strong>! You're now part of a thriving community of professionals, students, and organizations.
          </p>

          <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #4f46e5; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #4f46e5; margin-top: 0;">Get Started:</h3>
            <ul style="color: #64748b; line-height: 2;">
              <li>✅ Complete your profile with a photo and resume</li>
              <li>✅ Browse and connect with other professionals</li>
              <li>✅ Send and receive real-time messages</li>
              <li>✅ Upgrade to premium for unlimited networking</li>
            </ul>
          </div>

          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/dashboard" style="display: inline-block; padding: 12px 30px; background-color: white; color: #4f46e5; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Go to Dashboard →
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <h4 style="color: #1e293b; margin-bottom: 10px;">Premium Features:</h4>
            <ul style="color: #64748b; font-size: 14px; line-height: 1.8;">
              <li>🔓 Unlimited messaging conversations</li>
              <li>⭐ Priority support</li>
              <li>🎯 Advanced search and filtering</li>
              <li>📊 Analytics and insights</li>
            </ul>
            <p style="text-align: center; margin-top: 20px;">
              <a href="http://localhost:3000/premium" style="color: #4f46e5; text-decoration: none; font-weight: 600;">Explore Premium Plans →</a>
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #999; font-size: 12px;">
            <p>If you have any questions, feel free to reply to this email or visit our support center.</p>
            <p style="margin: 10px 0 0 0;">
              <a href="#" style="color: #4f46e5; text-decoration: none; margin: 0 10px;">Help Center</a> • 
              <a href="#" style="color: #4f46e5; text-decoration: none; margin: 0 10px;">FAQ</a> • 
              <a href="#" style="color: #4f46e5; text-decoration: none; margin: 0 10px;">Settings</a>
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #999;">
            <p>© 2025 Skill Connect. All rights reserved.</p>
          </div>

        </div>
      </div>
    `;

    try {
      const result = await this.sendEmail(email, subject, htmlContent);
      
      // Log email sent
      await pool.query(
        `INSERT INTO email_logs (email, subject, service, status, created_at)
         VALUES ($1, $2, 'sendpulse', 'sent', NOW())`,
        [email, subject]
      );

      return { success: true, email, message: 'Welcome email sent' };
    } catch (err) {
      console.error('[v0] Error sending welcome email:', err);
      throw err;
    }
  }
}

module.exports = new SendPulseService();

