/**
 * Authentication Routes
 * Defines public API endpoints for user authentication
 * No authentication required for these routes
 */

// Import Express router
const express = require("express");

// Import express-validator for request validation
const { body } = require("express-validator");

// Import authentication controller with login/register logic
const authController = require("../controllers/auth.controller");

// Create Express router instance
const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and receive JWT token
 *
 * Request body:
 *   - username: string (required)
 *   - password: string (required)
 *
 * Response: { token: string, user: { id, username, email } }
 * Status: 200 OK, 400 Bad Request, 401 Unauthorized
 */
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login
);

/**
 * POST /api/auth/register
 * Create new user account and receive JWT token
 *
 * Request body:
 *   - username: string (required, min 3 chars)
 *   - password: string (required, min 6 chars)
 *   - email: string (optional, must be valid email)
 *
 * Response: { token: string, user: { id, username, email } }
 * Status: 201 Created, 400 Bad Request, 409 Conflict (duplicate)
 */
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
  ],
  authController.register
);

// Export router to be mounted in main application
module.exports = router;
