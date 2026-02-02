/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// server/routes/users.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { sanitizeEmail, sanitizeString } = require('../utils/validation');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

router.get('/users', async (req, res) => {
  try {
    console.log('[v0] Fetching all users');
    const result = await pool.query(`
      SELECT 
        id, email, fullname, company, city, state, country, status, 
        qualification, branch, passoutyear, created_at
      FROM users 
      ORDER BY created_at DESC
    `);
    console.log('[v0] Found', result.rows.length, 'users');
    res.status(200).json({ success: true, users: result.rows });
  } catch (err) {
    console.error('[v0] Error fetching users:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

router.get('/user-stats', async (req, res) => {
  try {
    console.log('[v0] Generating user statistics');
    const result = await pool.query('SELECT * FROM users');
    const users = result.rows;

    // Aggregate data for stats
    const totalUsers = users.length;
    const statusCount = {
      employed: users.filter(u => u.status === 'employed').length,
      graduated: users.filter(u => u.status === 'graduated').length,
      pursuing: users.filter(u => u.status === 'pursuing').length,
    };

    // Aggregate by city, state, country for filters
    const cityCount = {};
    const stateCount = {};
    const countryCount = {};
    users.forEach(user => {
      if (user.city) cityCount[user.city] = (cityCount[user.city] || 0) + 1;
      if (user.state) stateCount[user.state] = (stateCount[user.state] || 0) + 1;
      if (user.country) countryCount[user.country] = (countryCount[user.country] || 0) + 1;
    });

    // Aggregate by qualification, passoutyear, branch with status
    const qualificationByYearStatus = {};
    const branchByQualYearStatus = {};
    users.forEach(user => {
      const qualKey = `${user.qualification}-${user.passoutyear}-${user.status}`;
      const branchKey = `${user.branch}-${user.qualification}-${user.passoutyear}-${user.status}`;
      qualificationByYearStatus[qualKey] = (qualificationByYearStatus[qualKey] || 0) + 1;
      branchByQualYearStatus[branchKey] = (branchByQualYearStatus[branchKey] || 0) + 1;
    });

    console.log('[v0] User statistics generated successfully');
    res.status(200).json({
      success: true,
      totalUsers,
      statusCount,
      cityCount,
      stateCount,
      countryCount,
      qualificationByYearStatus,
      branchByQualYearStatus
    });
  } catch (err) {
    console.error('[v0] Error generating user stats:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user stats',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

router.post('/upload-resume', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Email and name are required' });
    }
    
    const resumeFile = req.files?.resume;
    if (!resumeFile) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('[v0] Processing resume upload for:', email);

    // Check file size (less than 2MB)
    if (resumeFile.size > 2 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size exceeds 2MB limit' });
    }

    // Use temporary file path provided by express-fileupload
    const tempPath = resumeFile.tempFilePath || path.join('/tmp', 'uploads', resumeFile.name);
    console.log('[v0] Processing file at:', tempPath);

    // If file is not already saved to temp path, save it
    if (!fs.existsSync(tempPath)) {
      await resumeFile.mv(tempPath);
    }

    // Extract text from PDF
    let resumeData = '';
    if (resumeFile.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(tempPath);
      const data = await pdfParse(dataBuffer);
      resumeData = data.text;
      console.log('[v0] PDF parsed successfully, extracted', resumeData.length, 'characters');
    } else {
      resumeData = 'Text extraction for this file type is not supported yet.';
    }

    // Delete temporary file if it exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
      console.log('[v0] Temporary file cleaned up');
    }

    // Store in PostgreSQL
    const query = `
      INSERT INTO resumes (email, name, resume_data, resume_filename, file_type, file_size)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET 
        name = $2, 
        resume_data = $3,
        resume_filename = $4,
        file_size = $6,
        updated_at = NOW()
      RETURNING id, email, name, file_size, created_at
    `;
    const result = await pool.query(query, [
      sanitizeEmail(email), 
      sanitizeString(name), 
      resumeData,
      resumeFile.name,
      resumeFile.mimetype,
      resumeFile.size
    ]);
    
    console.log('[v0] Resume uploaded successfully for:', email);
    res.status(200).json({ 
      success: true, 
      message: 'Resume uploaded successfully',
      resume: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error uploading resume:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading resume',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

router.get('/user-resume', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    console.log('[v0] Fetching resume for:', email);
    const query = 'SELECT id, email, name, resume_data, resume_filename, created_at FROM resumes WHERE email = $1';
    const result = await pool.query(query, [sanitizeEmail(email)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No resume found for this user' });
    }
    
    console.log('[v0] Resume found for:', email);
    res.status(200).json({ 
      success: true, 
      resume: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error fetching resume:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching resume',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

router.get('/resume-users', async (req, res) => {
  try {
    console.log('[v0] Fetching all resume users');
    const query = 'SELECT id, name, email, created_at FROM resumes ORDER BY created_at DESC';
    const result = await pool.query(query);
    
    console.log('[v0] Found', result.rows.length, 'resume users');
    res.status(200).json({ 
      success: true, 
      users: result.rows 
    });
  } catch (err) {
    console.error('[v0] Error fetching resume users:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching resume users',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

router.delete('/delete-resume', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    console.log('[v0] Deleting resume for:', email);
    const query = 'DELETE FROM resumes WHERE email = $1 RETURNING id, email, name';
    const result = await pool.query(query, [sanitizeEmail(email)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No resume found for this email' });
    }
    
    console.log('[v0] Resume deleted for:', email);
    res.status(200).json({ 
      success: true, 
      message: 'Resume deleted successfully' 
    });
  } catch (err) {
    console.error('[v0] Error deleting resume:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting resume',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

module.exports = router;
