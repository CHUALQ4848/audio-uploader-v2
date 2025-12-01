/**
 * User Routes
 * Defines API endpoints for user account management
 * All routes require authentication via JWT token
 */

// Import Express router
const express = require("express");

// Import express-validator for request validation
const { body } = require("express-validator");

// Import authentication middleware to protect routes
const authMiddleware = require("../middleware/auth");

// Import user controller with business logic
const userController = require("../controllers/user.controller");

// Create Express router instance
const router = express.Router();

// Apply authentication middleware to ALL user routes
// This ensures only authenticated users can access these endpoints
router.use(authMiddleware);

/**
 * GET /api/users/me
 * Get current authenticated user's profile
 * Returns: { id, username, email, createdAt, updatedAt }
 */
router.get("/me", userController.getCurrentUser);

/**
 * PUT /api/users/:id
 * Update user account information
 *
 * Request body (all optional):
 *   - username: string (min 3 chars)
 *   - email: string (valid email format)
 *   - password: string (min 6 chars, will be hashed)
 *
 * Authorization: User can only update their own account
 * Validation: express-validator rules applied
 */
router.put(
  "/:id",
  [
    body("username")
      .optional()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  userController.updateUser
);

/**
 * DELETE /api/users/:id
 * Permanently delete user account and all associated data
 *
 * Authorization: User can only delete their own account
 * Cascade: All audio files owned by user will be deleted
 */
router.delete("/:id", userController.deleteUser);

// Export router to be mounted in main application
module.exports = router;
