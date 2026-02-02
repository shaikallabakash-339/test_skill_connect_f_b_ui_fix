/**
 * MinIO Service
 * Handles all file uploads to MinIO S3-compatible storage
 * Supports: Profile photos, Resumes, QR codes, Images
 */

const Minio = require('minio');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

// Initialize MinIO client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_HOST || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin'
});

const BUCKETS = {
  PROFILE_PHOTOS: 'profile-photos',
  RESUMES: 'resumes',
  QR_CODES: 'qr-codes',
  IMAGES: 'images',
  PAYMENTS: 'payment-screenshots'
};

// Ensure buckets exist
async function initializeBuckets() {
  try {
    for (const bucket of Object.values(BUCKETS)) {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket, 'us-east-1');
        console.log(`✓ Bucket created: ${bucket}`);
      } else {
        console.log(`✓ Bucket exists: ${bucket}`);
      }
    }
  } catch (err) {
    console.error('Error initializing MinIO buckets:', err);
  }
}

// Upload profile photo
async function uploadProfilePhoto(email, filePath) {
  try {
    const fileName = `${Date.now()}-${path.basename(filePath)}`;
    const fileStats = fs.statSync(filePath);

    await minioClient.fPutObject(
      BUCKETS.PROFILE_PHOTOS,
      `${email}/${fileName}`,
      filePath,
      { 'Content-Type': 'application/octet-stream' }
    );

    const photoUrl = `${process.env.MINIO_EXTERNAL_URL || 'http://minio:9000'}/${BUCKETS.PROFILE_PHOTOS}/${email}/${fileName}`;

    // Update user profile image URL in database
    await pool.query(
      'UPDATE users SET profile_image_url = $1 WHERE email = $2',
      [photoUrl, email]
    );

    return { success: true, photoUrl, fileName };
  } catch (err) {
    console.error('Error uploading profile photo:', err);
    throw new Error('Failed to upload profile photo: ' + err.message);
  }
}

// Upload resume
async function uploadResume(email, filePath, fileName) {
  try {
    const uniqueFileName = `${Date.now()}-${path.basename(filePath)}`;
    const fileStats = fs.statSync(filePath);

    await minioClient.fPutObject(
      BUCKETS.RESUMES,
      `${email}/${uniqueFileName}`,
      filePath,
      { 'Content-Type': 'application/octet-stream' }
    );

    const resumeUrl = `${process.env.MINIO_EXTERNAL_URL || 'http://minio:9000'}/${BUCKETS.RESUMES}/${email}/${uniqueFileName}`;

    // Store resume in database
    const result = await pool.query(
      `INSERT INTO resumes (email, name, minio_url, file_size, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [email, fileName, resumeUrl, fileStats.size]
    );

    return {
      success: true,
      resumeId: result.rows[0].id,
      resumeUrl,
      fileName,
      fileSize: fileStats.size
    };
  } catch (err) {
    console.error('Error uploading resume:', err);
    throw new Error('Failed to upload resume: ' + err.message);
  }
}

// Upload QR code for payments
async function uploadQRCode(fileName, filePath, paymentId = null) {
  try {
    const uniqueFileName = `${Date.now()}-${path.basename(filePath)}`;
    const fileStats = fs.statSync(filePath);

    await minioClient.fPutObject(
      BUCKETS.QR_CODES,
      uniqueFileName,
      filePath,
      { 'Content-Type': 'application/octet-stream' }
    );

    const qrUrl = `${process.env.MINIO_EXTERNAL_URL || 'http://minio:9000'}/${BUCKETS.QR_CODES}/${uniqueFileName}`;

    // Update payment record if needed
    if (paymentId) {
      await pool.query(
        'UPDATE payment_records SET qr_code_url = $1 WHERE id = $2',
        [qrUrl, paymentId]
      );
    }

    return { success: true, qrUrl, fileName: uniqueFileName };
  } catch (err) {
    console.error('Error uploading QR code:', err);
    throw new Error('Failed to upload QR code: ' + err.message);
  }
}

// Upload payment screenshot
async function uploadPaymentScreenshot(email, filePath, paymentId = null) {
  try {
    const uniqueFileName = `${Date.now()}-${path.basename(filePath)}`;
    const fileStats = fs.statSync(filePath);

    await minioClient.fPutObject(
      BUCKETS.PAYMENTS,
      `${email}/${uniqueFileName}`,
      filePath,
      { 'Content-Type': 'application/octet-stream' }
    );

    const screenshotUrl = `${process.env.MINIO_EXTERNAL_URL || 'http://minio:9000'}/${BUCKETS.PAYMENTS}/${email}/${uniqueFileName}`;

    // Update payment record if needed
    if (paymentId) {
      await pool.query(
        'UPDATE payment_records SET screenshot_url = $1, verified_at = NOW() WHERE id = $2',
        [screenshotUrl, paymentId]
      );
    }

    return { success: true, screenshotUrl, fileName: uniqueFileName };
  } catch (err) {
    console.error('Error uploading payment screenshot:', err);
    throw new Error('Failed to upload payment screenshot: ' + err.message);
  }
}

// Upload general images (for orphans, old age homes, etc.)
async function uploadImage(folderName, filePath, fileName = null) {
  try {
    const uniqueFileName = `${Date.now()}-${path.basename(filePath)}`;
    const fileStats = fs.statSync(filePath);

    await minioClient.fPutObject(
      BUCKETS.IMAGES,
      `${folderName}/${uniqueFileName}`,
      filePath,
      { 'Content-Type': 'application/octet-stream' }
    );

    const imageUrl = `${process.env.MINIO_EXTERNAL_URL || 'http://minio:9000'}/${BUCKETS.IMAGES}/${folderName}/${uniqueFileName}`;

    return { success: true, imageUrl, fileName: uniqueFileName };
  } catch (err) {
    console.error('Error uploading image:', err);
    throw new Error('Failed to upload image: ' + err.message);
  }
}

// Delete file from MinIO
async function deleteFile(bucket, filePath) {
  try {
    await minioClient.removeObject(bucket, filePath);
    return { success: true };
  } catch (err) {
    console.error('Error deleting file from MinIO:', err);
    throw new Error('Failed to delete file: ' + err.message);
  }
}

// Get presigned URL (for temporary download links)
async function getPresignedUrl(bucket, filePath, expirySeconds = 86400) {
  try {
    const url = await minioClient.presignedGetObject(bucket, filePath, expirySeconds);
    return { success: true, url };
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    throw new Error('Failed to generate presigned URL: ' + err.message);
  }
}

// List all files in a bucket
async function listBucketFiles(bucket, prefix = '') {
  try {
    const files = [];
    const stream = minioClient.listObjects(bucket, prefix, true);

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        files.push({
          name: obj.name,
          size: obj.size,
          lastModified: obj.lastModified
        });
      });

      stream.on('error', (err) => {
        reject(err);
      });

      stream.on('end', () => {
        resolve(files);
      });
    });
  } catch (err) {
    console.error('Error listing bucket files:', err);
    throw new Error('Failed to list files: ' + err.message);
  }
}

// Get bucket stats
async function getBucketStats() {
  const stats = {};

  for (const [key, bucket] of Object.entries(BUCKETS)) {
    try {
      const files = await listBucketFiles(bucket);
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      stats[bucket] = {
        fileCount: files.length,
        totalSize: totalSize,
        totalSizeFormatted: formatBytes(totalSize)
      };
    } catch (err) {
      stats[bucket] = { error: err.message };
    }
  }

  return stats;
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = {
  initializeBuckets,
  uploadProfilePhoto,
  uploadResume,
  uploadQRCode,
  uploadPaymentScreenshot,
  uploadImage,
  deleteFile,
  getPresignedUrl,
  listBucketFiles,
  getBucketStats,
  BUCKETS,
  minioClient
};
