/**
 * Authentication Controller
 * Handles user registration and login with JWT token generation
 */

// Import bcrypt for password hashing and comparison
const bcrypt = require("bcryptjs");

// Import jsonwebtoken for JWT generation and verification
const jwt = require("jsonwebtoken");

// Import express-validator for request validation
const { validationResult } = require("express-validator");

// Import Prisma client for database operations
const { PrismaClient } = require("@prisma/client");

// Initialize Prisma client instance
const prisma = new PrismaClient();

const authController = {
  /**
   * User Login
   * POST /api/auth/login
   *
   * Authenticates a user and returns a JWT token
   *
   * @param {string} req.body.username - User's username
   * @param {string} req.body.password - User's password (plain text)
   * @returns {Object} 200 - { token, user: { id, username, email } }
   * @returns {Object} 400 - Validation errors
   * @returns {Object} 401 - Invalid credentials
   */
  async login(req, res, next) {
    try {
      // Validate request body using express-validator rules
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract credentials from request body
      const { username, password } = req.body;

      // Find user in database by username
      const user = await prisma.user.findUnique({
        where: { username },
      });

      // Check if user exists
      // Use generic message to prevent username enumeration
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Compare provided password with hashed password in database
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token with user information
      // Token expires in 24 hours
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Return token and user info (exclude password)
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      // Pass error to error handling middleware
      next(error);
    }
  },

  /**
   * User Registration
   * POST /api/auth/register
   *
   * Creates a new user account and returns a JWT token
   *
   * @param {string} req.body.username - Desired username (min 3 chars)
   * @param {string} req.body.password - Password (min 6 chars)
   * @param {string} req.body.email - Optional email address
   * @returns {Object} 201 - { token, user: { id, username, email } }
   * @returns {Object} 400 - Validation errors
   * @returns {Object} 409 - Username or email already exists (handled by errorHandler)
   */
  async register(req, res, next) {
    try {
      // Validate request body using express-validator rules
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract registration data from request body
      const { username, password, email } = req.body;

      // Hash password using bcrypt with salt rounds of 10
      // This protects passwords even if database is compromised
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user in database
      // Prisma will throw error if username/email already exists (P2002)
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          email: email || null, // Set null if email not provided
        },
      });

      // Generate JWT token for immediate login after registration
      // Token expires in 24 hours
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Return token and user info (exclude password)
      // Use 201 Created status for successful registration
      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      // Pass error to error handling middleware
      // Will handle Prisma P2002 error for duplicate username/email
      next(error);
    }
  },
};

// Export auth controller for use in routes
module.exports = authController;
