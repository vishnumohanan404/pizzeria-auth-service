import { NextFunction, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { TokenService } from "../services/TokenService";
export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
    private tokenService: TokenService,
  ) {}
  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    // Validation
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = result.array();
      this.logger.error("Validation errors:", errors);
      res.status(400).json({ errors });
      return;
    }
    const { firstName, lastName, email, password } = req.body;
    this.logger.debug("New request to register a user", {
      firstName,
      lastName,
      email,
      password: "******",
    });
    try {
      const savedUser = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
      });
      this.logger.info(`User registered successfully.`, { id: savedUser.id });

      const payload: JwtPayload = {
        sub: String(savedUser.id),
        role: savedUser.role,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);
      // Persist Refresh Token
      const newRefreshToken =
        await this.tokenService.persistRefreshToken(savedUser);

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });

      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60, // 1h
        httpOnly: true,
      });
      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
        httpOnly: true,
      });

      res.status(201).json(savedUser);
    } catch (error) {
      next(error);
      return;
    }
  }
}
