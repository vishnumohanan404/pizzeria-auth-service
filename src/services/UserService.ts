import createHttpError from "http-errors";
import { User } from "../entity/User";
import { UserData } from "../types";
import { Repository } from "typeorm";
import { Roles } from "../constants";

export class UserService {
  constructor(private userRepository: Repository<User>) {}
  async create({ firstName, lastName, email, password }: UserData) {
    try {
      return await this.userRepository.save({
        firstName,
        lastName,
        email,
        password,
        role: Roles.CUSTOMER,
      });
    } catch (err) {
      console.error("Database save error:", err);
      const error = createHttpError(
        500,
        "Failed to store the data in the database",
      );
      throw error;
    }
  }
}
