/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 * Database initialization script - Seeds default data
 */

const { pool } = require('../config/database');

async function seedDatabase() {
  try {
    console.log('[v0] Starting database seeding...');

    // Check if subscription plans already exist
    const plansResult = await pool.query('SELECT COUNT(*) as count FROM subscription_plans');
    const plansCount = parseInt(plansResult.rows[0].count);

    if (plansCount === 0) {
      console.log('[v0] Creating subscription plans...');
      
      const plans = [
        { name: 'Monthly Premium', price: 100, duration_months: 1 },
        { name: 'Yearly Premium', price: 1000, duration_months: 12 }
      ];

      for (const plan of plans) {
        await pool.query(
          'INSERT INTO subscription_plans (name, price, duration_months, max_conversations) VALUES ($1, $2, $3, $4)',
          [plan.name, plan.price, plan.duration_months, -1]
        );
        console.log(`[v0] Created plan: ${plan.name}`);
      }
    } else {
      console.log(`[v0] Subscription plans already exist (${plansCount} found)`);
    }

    // Check if admin user exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@skillconnect.com';
    const adminResult = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    
    if (adminResult.rows.length === 0) {
      console.log('[v0] Creating default admin user...');
      
      // Hash admin password
      const bcrypt = require('bcryptjs');
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await pool.query(
        'INSERT INTO users (email, fullname, password, status) VALUES ($1, $2, $3, $4)',
        [adminEmail, 'Admin User', hashedPassword, 'admin']
      );
      console.log(`[v0] Created admin user: ${adminEmail}`);
    } else {
      console.log('[v0] Admin user already exists');
    }

    // Check if donation homes exist
    const homesResult = await pool.query('SELECT COUNT(*) as count FROM old_age_homes');
    const homesCount = parseInt(homesResult.rows[0].count);

    if (homesCount === 0) {
      console.log('[v0] Creating default donation homes...');
      
      const homes = [
        { name: 'Sunrise Old Age Home', description: 'Caring for elderly citizens' },
        { name: 'Golden Years Care', description: 'Providing dignified living' },
        { name: 'Hope Orphanage', description: 'Supporting underprivileged children' }
      ];

      for (const home of homes) {
        await pool.query(
          'INSERT INTO old_age_homes (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [home.name]
        );
        console.log(`[v0] Created home: ${home.name}`);
      }
    } else {
      console.log(`[v0] Donation homes already exist (${homesCount} found)`);
    }

    console.log('[v0] Database seeding completed successfully!');
    return true;
  } catch (err) {
    console.error('[v0] Database seeding failed:', err);
    return false;
  }
}

// Export for use in server.js
module.exports = { seedDatabase };

// Allow direct execution
if (require.main === module) {
  seedDatabase().then(() => {
    console.log('[v0] Seeding complete');
    process.exit(0);
  }).catch((err) => {
    console.error('[v0] Seeding error:', err);
    process.exit(1);
  });
}
