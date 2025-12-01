/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes requiring authentication
 */

// Import jsonwebtoken for token verification
const jwt = require("jsonwebtoken");

/**
 * Authentication Middleware
 *
 * Validates JWT token from Authorization header and attaches user info to request
 * Protected routes should use this middleware to ensure user is authenticated
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * Expected header format: "Authorization: Bearer <token>"
 *
 * On success: Adds req.user = { userId, username } and calls next()
 * On failure: Returns 401 Unauthorized
 */
const authMiddleware = (req, res, next) => {
  try {
    // Extract Authorization header from request
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Extract token by removing "Bearer " prefix (7 characters)
    const token = authHeader.substring(7);

    // Verify token signature and decode payload
    // Throws error if token is invalid, expired, or signature doesn't match
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user information to request object
    // This makes user info available to subsequent middleware/controllers
    req.user = decoded;

    // Proceed to next middleware or route handler
    next();
  } catch (error) {
    // Catch JWT verification errors (expired, malformed, invalid signature)
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Export middleware for use in route protection
module.exports = authMiddleware;
