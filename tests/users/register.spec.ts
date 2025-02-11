import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { Roles } from "../../src/constants";
import { isJwt } from "../utils";
import { RefreshToken } from "../../src/entity/RefreshToken";
describe("POST /auth/register", () => {
  let connection: DataSource;
  beforeAll(async () => {
    connection = await AppDataSource.initialize();
    console.log("connection :>> ", connection);
  });
  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();
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

    it("should return valid json response", async () => {
      // Arrange
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      // Act
      const response = await request(app).post("/auth/register").send(userData);

      // Assert application/json utf-8
      expect(
        (response.headers as Record<string, string>)["content-type"],
      ).toEqual(expect.stringContaining("json"));
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
    });

    it("should return an id of the created user", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      const response: { body: User } = await request(app)
        .post("/auth/register")
        .send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users[0].id).toBe(response.body.id);
    });

    it("should assign a customer role", async () => {
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
      expect(users[0]).toHaveProperty("role");
      expect(users[0].role).toBe(Roles.CUSTOMER);
    });

    it("should store the hash of the password in the database", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      await request(app).post("/auth/register").send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find({ select: ["password"] });
      expect(users[0].password).not.toBe(userData.password);
      expect(users[0].password).toHaveLength(60);
      expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
    });

    it("should return 400 if email is already exists", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      const userRepository = connection.getRepository(User);
      await userRepository.save({ ...userData, role: Roles.CUSTOMER });
      const response = await request(app).post("/auth/register").send(userData);
      const users = await userRepository.find();
      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return the access token and refresh token inside a coookie", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      const response = await request(app).post("/auth/register").send(userData);
      interface Headers {
        ["set-cookie"]: string[];
      }
      let accessToken: null | string = null;
      let refreshToken: null | string = null;
      const cookies =
        (response.headers as unknown as Headers)["set-cookie"] || [];
      cookies.forEach((cookie) => {
        if (cookie.startsWith("accessToken=")) {
          accessToken = cookie.split(";")[0].split("=")[1];
        }
        if (cookie.startsWith("refreshToken=")) {
          refreshToken = cookie.split(";")[0].split("=")[1];
        }
      });
      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();
      expect(isJwt(accessToken)).toBeTruthy();
      expect(isJwt(refreshToken)).toBeTruthy();
    });

    it("should store the refresh token in the database", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      const response = await request(app).post("/auth/register").send(userData);
      const refreshTokenRepo = connection.getRepository(RefreshToken);
      // const refreshToken = await refreshTokenRepo.find();
      const token = await refreshTokenRepo
        .createQueryBuilder("refreshToken")
        .where("refreshToken.userId = :userId", {
          userId: (response.body as Record<string, string>).id,
        })
        .getMany();
      expect(token).toHaveLength(1);
    });
  });

  describe("Fields are missing", () => {
    it("should return 400 status code if email field is missing", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "",
        password: "password123",
      };
      const response = await request(app).post("/auth/register").send(userData);
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users).toHaveLength(0);
    });
    it("should return 400 status code if firstName is missing", async () => {
      const userData = {
        firstName: "",
        lastName: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      const response = await request(app).post("/auth/register").send(userData);
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users).toHaveLength(0);
    });
    it("should return 400 status code if lastName is missing", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "",
        email: "vishnu@example.com",
        password: "password123",
      };
      const response = await request(app).post("/auth/register").send(userData);
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users).toHaveLength(0);
    });
    it("should return 400 status code if password is missing", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "vishnu@example.com",
        password: "",
      };
      const response = await request(app).post("/auth/register").send(userData);
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users).toHaveLength(0);
    });
  });

  describe("Fields are not in proper format", () => {
    it("should trim the email field", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "vishnu@example.com",
        password: "password123",
      };
      await request(app).post("/auth/register").send(userData);

      // Assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      const user = users[0];
      expect(user.email).toBe("vishnu@example.com");
    });
    it("should return 400 if email is not a valid email", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "xyz",
        password: "password123",
      };
      const response = await request(app).post("/auth/register").send(userData);
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users).toHaveLength(0);
    });
    it("should return 400 if password length is less than 8 chars", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "vishnu@example.com",
        password: "passwor",
      };
      const response = await request(app).post("/auth/register").send(userData);
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users).toHaveLength(0);
    });
    it("should return an array of error message if email is missing", async () => {
      const userData = {
        firstName: "Vishnu",
        lastName: "Mohan",
        email: "",
        password: "password123",
      };
      const response = await request(app).post("/auth/register").send(userData);

      expect(response.body).toHaveProperty("errors");
      expect(
        (response.body as Record<string, string>).errors.length,
      ).toBeGreaterThan(0);
    });
  });
});
