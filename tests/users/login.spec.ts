import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";

describe("POST /auth/login", () => {
  let connection: DataSource;
  beforeAll(async () => {
    // connection = await AppDataSource.initialize();
    connection = await AppDataSource.initialize();
  });
  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();
  });
  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    // TODO: write all tests with ref as reg
    it.todo("should return the access token and refresh token inside a cookie");
    it.todo("should return the 400 if email or password is wrong");
  });
});
