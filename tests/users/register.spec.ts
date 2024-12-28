import request from "supertest";
import app from "../../src/app";
describe("POST /auth/register", () => {
  describe("Given all fields", () => {
    it("should return the 201 status code", async () => {
      // AAA
      // Arrange
      const userData = {
        firstName: "Vishnu",
        lastname: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      // Act
      const response = await request(app).post("/auth/register").send(userData);
      // Assert
      expect(response.statusCode).toBe(201);
    });
    it("should return a valid json response", async () => {
      const userData = {
        firstName: "Vishnu",
        lastname: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      const response = await request(app).post("/auth/register").send(userData);
      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("json"),
      );
    });
    it("should persist user in the database", async () => {
      const userData = {
        firstName: "Vishnu",
        lastname: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      // const response =
      await request(app).post("/auth/register").send(userData);
    });
  });
  describe("happy path", () => {});
});
