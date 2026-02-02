/**
 * File Upload Routes
 * Handles profile photos, resumes, QR codes, and payment screenshots
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadProfilePhoto, uploadResume, uploadQRCode, uploadPaymentScreenshot, deleteFile, BUCKETS } = require('../utils/minioService');
const pool = require('../config/db');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Profile photos: images only
    if (req.path.includes('profile-photo')) {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Only image files are allowed for profile photos'));
      }
    }

    // Resumes: documents only
    if (req.path.includes('resume')) {
      const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Only PDF and Word documents are allowed for resumes'));
      }
    }

    // Payment screenshots: images only
    if (req.path.includes('payment')) {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Only image files are allowed for payment screenshots'));
      }
    }

    cb(null, true);
  }
});

/**
 * POST /api/upload-profile-photo
 * Upload user profile photo to MinIO
 */
router.post('/upload-profile-photo', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const email = req.body.email;
    if (!email) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Upload to MinIO
    const result = await uploadProfilePhoto(email, req.file.path);

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      photoUrl: result.photoUrl
    });
  } catch (err) {
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Profile photo upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/upload-resume
 * Upload user resume to MinIO
 */
router.post('/upload-resume', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const email = req.body.email;
    if (!email) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Upload to MinIO
    const result = await uploadResume(email, req.file.path, req.file.originalname);

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      resumeUrl: result.resumeUrl,
      resumeId: result.resumeId,
      fileName: result.fileName,
      fileSize: result.fileSize
    });
  } catch (err) {
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Resume upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/resume/:resumeId
 * Delete resume from MinIO and database
 */
router.delete('/resume/:resumeId', async (req, res) => {
  try {
    const resumeId = req.params.resumeId;

    // Get resume from database
    const resumeResult = await pool.query(
      'SELECT * FROM resumes WHERE id = $1',
      [resumeId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const resume = resumeResult.rows[0];

    // Delete from database
    await pool.query('DELETE FROM resumes WHERE id = $1', [resumeId]);

    // Delete from MinIO
    try {
      const key = resume.minio_url.split(`/${BUCKETS.RESUMES}/`)[1];
      await deleteFile(BUCKETS.RESUMES, key);
    } catch (minioErr) {
      console.error('Error deleting from MinIO:', minioErr);
      // Continue anyway - db record is already deleted
    }

    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (err) {
    console.error('Resume deletion error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/resumes/:email
 * Get all resumes for a user
 */
router.get('/resumes/:email', async (req, res) => {
  try {
    const email = req.params.email;

    const result = await pool.query(
      'SELECT id, name, minio_url, file_size, created_at FROM resumes WHERE email = $1 ORDER BY created_at DESC',
      [email]
    );

    res.json({
      success: true,
      resumes: result.rows || []
    });
  } catch (err) {
    console.error('Error fetching resumes:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/upload-payment-screenshot
 * Upload payment verification screenshot to MinIO
 */
router.post('/upload-payment-screenshot', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const email = req.body.email;
    const paymentId = req.body.paymentId;

    if (!email) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Upload to MinIO
    const result = await uploadPaymentScreenshot(email, req.file.path, paymentId || null);

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Payment screenshot uploaded successfully',
      screenshotUrl: result.screenshotUrl,
      fileName: result.fileName
    });
  } catch (err) {
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Payment screenshot upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/upload-qr-code
 * Upload QR code for payment methods
 */
router.post('/upload-qr-code', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const paymentId = req.body.paymentId;

    // Upload to MinIO
    const result = await uploadQRCode(req.file.originalname, req.file.path, paymentId || null);

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'QR code uploaded successfully',
      qrUrl: result.qrUrl,
      fileName: result.fileName
    });
  } catch (err) {
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('QR code upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
