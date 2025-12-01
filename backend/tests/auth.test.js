const request = require("supertest");
const app = require("../src/server");

describe("Health Check", () => {
  it("should return 200 OK", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
  });
});

describe("Auth API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "testpass123",
        email: "test@example.com",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("username", "testuser");
    });

    it("should fail with invalid data", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "ab",
        password: "123",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      // First register
      await request(app).post("/api/auth/register").send({
        username: "logintest",
        password: "testpass123",
      });

      // Then login
      const response = await request(app).post("/api/auth/login").send({
        username: "logintest",
        password: "testpass123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("should fail with invalid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "nonexistent",
        password: "wrongpass",
      });

      expect(response.status).toBe(401);
    });
  });
});
