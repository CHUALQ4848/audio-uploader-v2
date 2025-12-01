/**
 * Multer Configuration
 * Configures file upload middleware for audio files
 * Handles file validation, storage, and size limits
 */

// Import multer for handling multipart/form-data file uploads
const multer = require("multer");

/**
 * Storage Configuration
 * Use memory storage to keep files in RAM as Buffer objects
 * This allows direct upload to S3 without saving to disk
 * Files are stored in req.file.buffer
 */
const storage = multer.memoryStorage();

/**
 * File Filter Function
 * Validates uploaded files to ensure only audio files are accepted
 *
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object with mimetype
 * @param {Function} cb - Callback function (error, acceptFile)
 *
 * Accepts file: cb(null, true)
 * Rejects file: cb(error, false)
 */
const fileFilter = (req, file, cb) => {
  // Define allowed audio MIME types
  // Note: This list is limited. Consider expanding to include:
  // audio/mpeg, audio/wav, audio/ogg, audio/aac, audio/flac, etc.
  const allowedMimeTypes = ["audio/avi", "audio/mp4", "audio/mpeg"];

  // Check if uploaded file's MIME type is in allowed list
  if (allowedMimeTypes.includes(file.mimetype)) {
    // Accept the file
    cb(null, true);
  } else {
    // Reject the file with error message
    cb(new Error("Invalid file type. Only audio files are allowed."), false);
  }
};

/**
 * Multer Upload Configuration
 * Combines storage, file filter, and size limits
 *
 * Configuration:
 *   - storage: Memory storage (files in Buffer)
 *   - fileFilter: Audio file validation
 *   - limits.fileSize: Maximum 50MB per file
 *
 * Usage: upload.single('fieldName') in routes
 */
const upload = multer({
  storage, // Use memory storage
  fileFilter, // Apply audio file validation
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size (in bytes)
  },
});

// Export configured multer instance for use in routes
module.exports = upload;
