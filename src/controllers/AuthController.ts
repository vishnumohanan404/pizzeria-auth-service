import { NextFunction, Response } from "express";
import { JwtPayload, sign } from "jsonwebtoken";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import fs from "fs";
import path from "path";
import createHttpError from "http-errors";
import { Config } from "../config";
export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
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
      let privateKey: Buffer;
      try {
        privateKey = fs.readFileSync(
          path.join(__dirname, "../../certs/private.pem"),
        );
      } catch {
        const err = createHttpError(500, "Error while reading private key");
        next(err);
        return;
      }
      const payload: JwtPayload = {
        sub: String(savedUser.id),
        role: savedUser.role,
      };
      const accessToken = sign(payload, privateKey, {
        algorithm: "RS256",
        expiresIn: "1h",
        issuer: "auth-service",
      });
      const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
        algorithm: "HS256",
        expiresIn: "1y",
        issuer: "auth-service",
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
