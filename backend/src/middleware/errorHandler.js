/**
 * Global Error Handler Middleware
 * Catches and formats all errors thrown in the application
 * Provides consistent error responses and detailed logging
 */

// Import multer for error type checking
const multer = require("multer");

/**
 * Error Handler Middleware
 *
 * Handles different types of errors and returns appropriate HTTP responses
 * Should be placed last in middleware chain (after all routes)
 *
 * @param {Error} err - Error object thrown by application
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * Handles:
 * - Multer file upload errors (400)
 * - Validation errors (400)
 * - Authentication errors (401)
 * - Prisma database errors (404, 409)
 * - AWS S3 errors (500)
 * - Generic errors (500)
 */
const errorHandler = (err, req, res, next) => {
  // Log error with contextual information for debugging
  // Include timestamp, error details, request info, and user ID
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    // Only include stack trace in development for security
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    user: req.user?.userId, // Optional chaining for unauthenticated requests
  });

  // Handle Multer file upload errors
  // Multer throws specific errors for file size, count, etc.
  if (err instanceof multer.MulterError) {
    // File size exceeded limit
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        details: "Maximum file size is 50MB",
      });
    }
    // Other Multer errors (field name, unexpected field, etc.)
    return res.status(400).json({
      error: "File upload error",
      details: err.message,
    });
  }

  // Handle custom file filter errors from multer config
  // Thrown when file type validation fails
  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      error: "Invalid file type",
      details: err.message,
    });
  }

  // Handle validation errors from express-validator
  // Thrown when request validation fails in routes
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: err.message,
    });
  }

  // Handle authentication and JWT errors
  // UnauthorizedError: from express-jwt (if used)
  // JsonWebTokenError: from jwt.verify() failures
  if (err.name === "UnauthorizedError" || err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Unauthorized",
      details: "Invalid or expired token",
    });
  }

  // Handle Prisma unique constraint violation (P2002)
  // Thrown when trying to create duplicate username, email, etc.
  if (err.code === "P2002") {
    return res.status(409).json({
      error: "Duplicate Entry",
      details: "A record with this value already exists",
    });
  }

  // Handle Prisma record not found error (P2025)
  // Thrown when update/delete operations target non-existent record
  if (err.code === "P2025") {
    return res.status(404).json({
      error: "Not Found",
      details: "The requested resource was not found",
    });
  }

  // Handle AWS S3 service errors
  // Thrown by AWS SDK when S3 operations fail
  // $metadata is present in all AWS SDK v3 errors
  if (err.name === "S3ServiceException" || err.$metadata) {
    return res.status(500).json({
      error: "Storage Error",
      details: "Failed to process file storage operation",
    });
  }

  // Default error handler for any unhandled errors
  // Use error status if provided, otherwise 500
  // Include stack trace only in development environment
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    // Spread operator conditionally adds stack in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Export error handler middleware
module.exports = { errorHandler };
