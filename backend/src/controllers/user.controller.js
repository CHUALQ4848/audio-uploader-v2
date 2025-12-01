/**
 * User Controller
 * Handles user account operations including profile retrieval, updates, and deletion
 */

// Import bcrypt for password hashing
const bcrypt = require("bcryptjs");

// Import express-validator for request validation
const { validationResult } = require("express-validator");

// Import Prisma client for database operations
const { PrismaClient } = require("@prisma/client");

// Initialize Prisma client instance
const prisma = new PrismaClient();

const userController = {
  /**
   * Get Current User Profile
   * GET /api/users/me
   *
   * Retrieves the authenticated user's profile information
   *
   * @param {string} req.user.userId - Authenticated user ID from JWT
   * @returns {Object} 200 - User profile (id, username, email, timestamps)
   * @returns {Object} 404 - User not found
   */
  async getCurrentUser(req, res, next) {
    try {
      // Fetch user from database using ID from JWT token
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          // Note: password is excluded for security
        },
      });

      // Check if user exists
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user profile
      res.json(user);
    } catch (error) {
      // Pass error to error handling middleware
      next(error);
    }
  },

  /**
   * Update User Account
   * PUT /api/users/:id
   *
   * Updates user account information (username, email, password)
   * User can only update their own account
   *
   * @param {string} req.params.id - User ID to update
   * @param {string} req.body.username - Optional new username
   * @param {string} req.body.email - Optional new email
   * @param {string} req.body.password - Optional new password
   * @param {string} req.user.userId - Authenticated user ID from JWT
   * @returns {Object} 200 - Updated user profile
   * @returns {Object} 400 - Validation errors
   * @returns {Object} 403 - User trying to update another user's account
   * @returns {Object} 409 - Username/email already exists (handled by errorHandler)
   */
  async updateUser(req, res, next) {
    try {
      // Validate request body using express-validator rules
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract user ID from URL parameters
      const { id } = req.params;

      // Authorization check: user can only update their own account
      if (req.user.userId !== id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Extract optional update fields from request body
      const { username, email, password } = req.body;
      const updateData = {};

      // Build update object with only provided fields
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      // Hash new password if provided
      if (password) updateData.password = await bcrypt.hash(password, 10);

      // Update user in database
      // Prisma will throw P2002 error if username/email already exists
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          updatedAt: true,
          // Note: password is excluded for security
        },
      });

      // Return updated user profile
      res.json(user);
    } catch (error) {
      // Pass error to error handling middleware
      next(error);
    }
  },

  /**
   * Delete User Account
   * DELETE /api/users/:id
   *
   * Permanently deletes a user account and all associated data
   * User can only delete their own account
   * This will cascade delete all audio files owned by the user (database constraint)
   *
   * @param {string} req.params.id - User ID to delete
   * @param {string} req.user.userId - Authenticated user ID from JWT
   * @returns {Object} 200 - Success message
   * @returns {Object} 403 - User trying to delete another user's account
   * @returns {Object} 404 - User not found (handled by errorHandler)
   */
  async deleteUser(req, res, next) {
    try {
      // Extract user ID from URL parameters
      const { id } = req.params;

      // Authorization check: user can only delete their own account
      if (req.user.userId !== id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Delete user from database
      // This will cascade delete all associated audio files
      // due to foreign key constraint (onDelete: Cascade in schema)
      await prisma.user.delete({
        where: { id },
      });

      // Return success message
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      // Pass error to error handling middleware
      // Will handle P2025 error if user not found
      next(error);
    }
  },
};

// Export user controller for use in routes
module.exports = userController;
