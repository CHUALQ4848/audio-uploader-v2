/**
 * Audio Controller
 * Handles all audio file operations including upload, retrieval, playback, and deletion
 */

// Import Prisma client for database operations
const { PrismaClient } = require("@prisma/client");

// Import S3 service functions for AWS storage operations
const {
  uploadToS3,
  deleteFromS3,
  getPresignedUrl,
} = require("../services/s3.service");

// Initialize Prisma client instance
const prisma = new PrismaClient();

const audioController = {
  /**
   * Upload Audio File
   * POST /api/audio/upload
   *
   * Handles multipart file upload, validates input, uploads to S3, and saves metadata to database
   *
   * @param {Object} req.file - Multer file object containing uploaded audio
   * @param {string} req.body.title - Title of the audio file
   * @param {string} req.body.description - Optional description
   * @param {string} req.body.category - Category of audio (Music, Podcast, etc.)
   * @param {string} req.user.userId - Authenticated user ID from JWT
   * @returns {Object} 201 - Created audio file metadata
   */
  async uploadAudio(req, res, next) {
    try {
      // Check if file was uploaded via multer
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      // Extract form data from request body
      const { title, description, category } = req.body;

      // Validate required fields (additional to route validation)
      if (!title || !category) {
        return res
          .status(400)
          .json({ error: "Title and category are required" });
      }

      // Upload file to AWS S3 bucket
      // Returns S3 key and public URL
      const s3Result = await uploadToS3(req.file, req.user.userId);

      // Save audio file metadata to PostgreSQL database
      const audioFile = await prisma.audioFile.create({
        data: {
          title,
          description: description || null, // Set null if empty
          category,
          s3Key: s3Result.key, // S3 object key for retrieval
          s3Url: s3Result.url, // Public S3 URL
          fileName: req.file.originalname, // Original file name
          fileSize: req.file.size, // File size in bytes
          mimeType: req.file.mimetype, // Audio MIME type
          userId: req.user.userId, // Associate with authenticated user
        },
      });
      console.log("Audio file uploaded:", audioFile);
      // Return created audio file with 201 status
      res.status(201).json(audioFile);
    } catch (error) {
      // Pass error to error handling middleware
      next(error);
    }
  },

  /**
   * Get User's Audio Files
   * GET /api/audio
   *
   * Retrieves all audio files belonging to the authenticated user
   * Supports optional category filtering
   *
   * @param {string} req.query.category - Optional category filter
   * @param {string} req.user.userId - Authenticated user ID from JWT
   * @returns {Array} 200 - Array of audio file objects
   */
  async getUserAudioFiles(req, res, next) {
    try {
      // Extract optional category filter from query parameters
      const { category } = req.query;

      // Build query filter - always filter by authenticated user
      const where = { userId: req.user.userId };

      // Add category filter if provided
      if (category) {
        where.category = category;
      }

      // Fetch audio files from database
      // Ordered by creation date (newest first)
      const audioFiles = await prisma.audioFile.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      // Return audio files array
      res.json(audioFiles);
    } catch (error) {
      // Pass error to error handling middleware
      next(error);
    }
  },

  /**
   * Get Single Audio File
   * GET /api/audio/:id
   *
   * Retrieves detailed information about a specific audio file
   * User can only access their own audio files
   *
   * @param {string} req.params.id - UUID of the audio file
   * @param {string} req.user.userId - Authenticated user ID from JWT
   * @returns {Object} 200 - Audio file metadata
   * @returns {Object} 404 - Audio file not found
   * @returns {Object} 403 - User doesn't own this audio file
   */
  async getAudioFile(req, res, next) {
    try {
      // Extract audio file ID from URL parameters
      const { id } = req.params;

      // Find audio file in database by ID
      const audioFile = await prisma.audioFile.findUnique({
        where: { id },
      });

      // Check if audio file exists
      if (!audioFile) {
        return res.status(404).json({ error: "Audio file not found" });
      }

      // Verify user owns this audio file (authorization check)
      if (audioFile.userId !== req.user.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Return audio file metadata
      res.json(audioFile);
    } catch (error) {
      // Pass error to error handling middleware
      next(error);
    }
  },

  /**
   * Get Audio File by File Name
   * GET /api/audio/check/:fileName
   *
   * Retrieves detailed information about a specific audio file
   * Recognizes audio file by its file name
   *
   * @param {string} req.params.fileName - File name of the audio file
   * @param {string} req.user.userId - Authenticated user ID from JWT
   * @returns {Object} 200 - { message, audioFile }
   */
  async getAudioFileByName(req, res, next) {
    try {
      // Extract audio file name from URL parameters
      const { fileName, userId } = req.params;

      // Find audio file in database by file name and check if belongs to user
      const audioFile = await prisma.audioFile.findFirst({
        where: { fileName, userId },
      });

      // Check if audio file exists
      if (audioFile) {
        // Return audio file metadata and message for frontend handling
        return res.json({
          message:
            "This audio file was uploaded previously. Please proceed if you want to re-upload it.",
          audioFile,
        });
      }
      // File not found - return message indicating it's a new file
      return res.json({ message: "Audio file not found, proceed with upload" });
    } catch (error) {
      // Pass error to error handling middleware
      next(error);
    }
  },

  /**
   * Get Playback URL
   * GET /api/audio/:id/play
   *
   * Generates a pre-signed S3 URL for secure audio playback
   * URL is temporary and expires after 1 hour (configurable in s3.service.js)
   * User can only access their own audio files
   *
   * @param {string} req.params.id - UUID of the audio file
   * @param {string} req.user.userId - Authenticated user ID from JWT
   * @returns {Object} 200 - { url: presigned S3 URL }
   * @returns {Object} 404 - Audio file not found
   * @returns {Object} 403 - User doesn't own this audio file
   */
  async getPlaybackUrl(req, res, next) {
    try {
      // Extract audio file ID from URL parameters
      const { id } = req.params;

      // Find audio file in database by ID
      const audioFile = await prisma.audioFile.findUnique({
        where: { id },
      });

      // Check if audio file exists
      if (!audioFile) {
        return res.status(404).json({ error: "Audio file not found" });
      }

      // Verify user owns this audio file (authorization check)
      if (audioFile.userId !== req.user.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Generate pre-signed URL from AWS S3
      // This URL provides temporary access to the private S3 object
      const presignedUrl = await getPresignedUrl(audioFile.s3Key);

      // Return pre-signed URL for playback
      res.json({ url: presignedUrl });
    } catch (error) {
      // Pass error to error handling middleware
      next(error);
    }
  },

  /**
   * Delete Audio File
   * DELETE /api/audio/:id
   *
   * Permanently deletes an audio file from both S3 storage and database
   * User can only delete their own audio files
   *
   * @param {string} req.params.id - UUID of the audio file
   * @param {string} req.user.userId - Authenticated user ID from JWT
   * @returns {Object} 200 - Success message
   * @returns {Object} 404 - Audio file not found
   * @returns {Object} 403 - User doesn't own this audio file
   */
  async deleteAudio(req, res, next) {
    try {
      // Extract audio file ID from URL parameters
      const { id } = req.params;

      // Find audio file in database by ID
      const audioFile = await prisma.audioFile.findUnique({
        where: { id },
      });

      // Check if audio file exists
      if (!audioFile) {
        return res.status(404).json({ error: "Audio file not found" });
      }

      // Verify user owns this audio file (authorization check)
      if (audioFile.userId !== req.user.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Delete audio file from AWS S3 storage
      await deleteFromS3(audioFile.s3Key);

      // Delete audio file metadata from database
      // This will cascade delete due to foreign key constraints
      await prisma.audioFile.delete({
        where: { id },
      });

      // Return success message
      res.json({ message: "Audio file deleted successfully" });
    } catch (error) {
      // Pass error to error handling middleware
      next(error);
    }
  },
};

// Export audio controller for use in routes
module.exports = audioController;
