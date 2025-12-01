/**
 * Audio Routes
 * Defines API endpoints for audio file management
 * All routes require authentication via JWT token
 */

// Import Express router
const express = require("express");

// Import express-validator for request validation
const { body, param, query } = require("express-validator");

// Import authentication middleware to protect routes
const authMiddleware = require("../middleware/auth");

// Import multer configuration for file upload handling
const upload = require("../config/multer");

// Import audio controller with business logic
const audioController = require("../controllers/audio.controller");

// Create Express router instance
const router = express.Router();

// Apply authentication middleware to ALL audio routes
// This ensures only authenticated users can access these endpoints
router.use(authMiddleware);

/**
 * POST /api/audio/upload
 * Upload audio file with metadata
 *
 * Request (multipart/form-data):
 *   - audio: file (audio file, max 50MB, required)
 *   - title: string (1-200 chars, required)
 *   - description: string (0-1000 chars, optional)
 *   - category: string (predefined categories, required)
 *
 * Process: Multer validation → express-validator → Controller
 * Response: Audio file metadata with S3 URL
 * Status: 201 Created, 400 Bad Request, 401 Unauthorized
 */
router.post(
  "/upload",
  upload.single("audio"), // Multer middleware handles file upload
  [
    // Validate title length
    body("title")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title is required and must be less than 200 characters"),
    // Validate optional description
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    // Validate category against allowed values
    body("category")
      .isIn([
        "Music",
        "Podcast",
        "Audiobook",
        "Sound Effect",
        "Voice Recording",
        "Other",
      ])
      .withMessage("Invalid category"),
  ],
  audioController.uploadAudio
);

/**
 * GET /api/audio
 * Get all audio files for authenticated user
 *
 * Query parameters:
 *   - category: string (optional filter by category)
 *
 * Response: Array of audio file metadata
 * Status: 200 OK, 400 Bad Request (invalid category), 401 Unauthorized
 */
router.get(
  "/",
  [
    // Validate optional category query parameter
    query("category")
      .optional()
      .isIn([
        "Music",
        "Podcast",
        "Audiobook",
        "Sound Effect",
        "Voice Recording",
        "Other",
      ])
      .withMessage("Invalid category filter"),
  ],
  audioController.getUserAudioFiles
);

/**
 * GET /api/audio/check/:fileName
 * Check if audio file with this name exists
 *
 * URL parameters:
 *  - fileName: string (audio file name)
 *
 * Response: { message, audioFile } if exists, empty response if not
 * Status: 200 OK
 */
router.get(
  "/check/:fileName/:userId",
  [
    param("fileName").notEmpty().withMessage("File name is required"),
    param("userId").notEmpty().withMessage("User ID is required"),
  ],
  audioController.getAudioFileByName
);

/**
 * GET /api/audio/:id
 * Get single audio file metadata
 *
 * URL parameters:
 *   - id: UUID (audio file ID)
 *
 * Authorization: User can only access their own audio files
 * Response: Audio file metadata
 * Status: 200 OK, 400 Bad Request, 403 Forbidden, 404 Not Found
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid audio file ID")],
  audioController.getAudioFile
);

/**
 * GET /api/audio/:id/play
 * Get pre-signed S3 URL for audio playback
 *
 * URL parameters:
 *   - id: UUID (audio file ID)
 *
 * Authorization: User can only play their own audio files
 * Response: { url: string } (expires in 1 hour)
 * Status: 200 OK, 400 Bad Request, 403 Forbidden, 404 Not Found
 */
router.get(
  "/:id/play",
  [param("id").isUUID().withMessage("Invalid audio file ID")],
  audioController.getPlaybackUrl
);

/**
 * DELETE /api/audio/:id
 * Delete audio file from S3 and database
 *
 * URL parameters:
 *   - id: UUID (audio file ID)
 *
 * Authorization: User can only delete their own audio files
 * Process: Delete from S3 → Delete from database
 * Response: { message: string }
 * Status: 200 OK, 400 Bad Request, 403 Forbidden, 404 Not Found
 */
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("Invalid audio file ID")],
  audioController.deleteAudio
);

// Export router to be mounted in main application
module.exports = router;
