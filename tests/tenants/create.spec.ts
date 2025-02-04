import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import request from "supertest";
import app from "../../src/app";

describe("POST /tenants", () => {
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
    it("should return 201 status code", async () => {
      const tenantData = {
        name: "Tenant name",
        address: "Tenant address",
      };
      const response = await request(app).post("/tenants").send(tenantData);
      expect(response.statusCode).toBe(201);
    });
  });
});
