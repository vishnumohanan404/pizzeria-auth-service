import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { truncatetTables } from "../utils";
describe("POST /auth/register", () => {
  let connection: DataSource;
  beforeAll(async () => {
    // connection = await AppDataSource.initialize();
    try {
      connection = await AppDataSource.initialize();
      console.log("Database connection initialized.");
    } catch (error) {
      console.error("Error in beforeAll:", error);
      throw error; // Ensure the test suite fails if initialization fails
    }
  });
  beforeEach(async () => {
    await truncatetTables(connection);
  });
  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should return the 201 status code", async () => {
      // AAA
      // Arrange
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
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
        lastName: "Mohan",
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
        lastName: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      // const response =
      await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(userData.email);
      expect(users[0].firstName).toBe(userData.firstName);
      expect(users[0].lastName).toBe(userData.lastName);
      expect(users[0].password).toBe(userData.password);
    });
    it("should return an id of the created user", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      // const response =
      const response: { body: User } = await request(app)
        .post("/auth/register")
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users[0].id).toBe(response.body.id);
    });
  });
  describe("happy path", () => {});
});
