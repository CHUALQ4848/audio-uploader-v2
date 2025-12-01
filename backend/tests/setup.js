// Load environment variables from .env file first
require("dotenv").config();

// Set NODE_ENV to test for all tests
process.env.NODE_ENV = "test";

// Set test database URL if needed
// Use a test database or fallback to a default
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://audiouser:audiopass@localhost:5432/audiodb?schema=public";
}

// Set a test JWT secret
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-jwt-secret-key";
}

// Set AWS credentials for tests (use dummy values if not set)
process.env.AWS_REGION = process.env.AWS_REGION || "us-east-1";
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "test-key";
process.env.AWS_SECRET_ACCESS_KEY =
  process.env.AWS_SECRET_ACCESS_KEY || "test-secret";
process.env.AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "test-bucket";
