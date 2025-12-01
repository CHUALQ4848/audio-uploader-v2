/**
 * AWS S3 Service
 * Handles all interactions with AWS S3 for audio file storage
 * Provides upload, delete, and pre-signed URL generation functionality
 */

// Import AWS SDK v3 S3 client and commands
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

// Import S3 request presigner for generating temporary URLs
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Import UUID generator for unique file naming
const { v4: uuidv4 } = require("uuid");

// Initialize S3 client with AWS credentials and region
// Configuration is loaded from environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload Audio File to S3
 *
 * Uploads an audio file to AWS S3 bucket with a unique key
 * Files are organized by user ID to prevent naming conflicts
 *
 * @param {Object} file - Multer file object (with buffer, originalname, mimetype)
 * @param {string} userId - User ID to organize files by user
 * @returns {Promise<Object>} Object containing S3 key and public URL
 *
 * Key format: audio/{userId}/{uuid}-{originalFilename}
 * Example: audio/123e4567-e89b-12d3-a456-426614174000/louis-song.mp3
 */
const uploadToS3 = async (file, userId) => {
  // Generate unique S3 key with user folder structure
  // Format: audio/{userId}/{uuid}-{originalFilename}
  const key = `audio/${userId}/${uuidv4()}-${file.originalname}`;

  // Create S3 put object command with file data
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET, // Target S3 bucket
    Key: key, // Unique object key (path)
    Body: file.buffer, // File content from multer memory storage
    ContentType: file.mimetype, // Set correct MIME type for browser playback
  });

  // Execute upload command to S3
  await s3Client.send(command);

  // Return S3 key and public URL for database storage
  return {
    key, // Store key to retrieve/delete file later
    url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
};

/**
 * Delete Audio File from S3
 *
 * Permanently removes an audio file from AWS S3 bucket
 * Called when user deletes an audio file from the application
 *
 * @param {string} key - S3 object key (path) of the file to delete
 * @returns {Promise<void>}
 *
 * Note: This operation is irreversible. Ensure authorization before calling.
 */
const deleteFromS3 = async (key) => {
  // Create S3 delete object command
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET, // Target S3 bucket
    Key: key, // Object key (path) to delete
  });

  // Execute delete command to S3
  await s3Client.send(command);
};

/**
 * Generate Pre-signed URL for Audio Playback
 *
 * Creates a temporary, secure URL for accessing private S3 objects
 * URL expires after specified time to prevent unauthorized sharing
 * Used for secure audio playback without exposing S3 credentials
 *
 * @param {string} key - S3 object key (path) of the file
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} Pre-signed URL that grants temporary access
 *
 * Security: URL is only valid for the specified duration
 * After expiration, a new pre-signed URL must be generated
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
  // Create S3 get object command
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET, // Target S3 bucket
    Key: key, // Object key (path) to access
  });

  // Generate pre-signed URL with expiration
  // This URL allows temporary access without AWS credentials
  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
};

// Export S3 service functions for use in controllers
module.exports = {
  uploadToS3,
  deleteFromS3,
  getPresignedUrl,
};
