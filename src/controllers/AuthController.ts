import { NextFunction, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { AuthRequest, RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { TokenService } from "../services/TokenService";
import createHttpError from "http-errors";
import { CredentialService } from "../services/CredentialService";
import { Roles } from "../constants";
export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
    private tokenService: TokenService,
    private credentialService: CredentialService,
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
        role: Roles.CUSTOMER,
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

      res.status(201).json({ id: savedUser.id });
    } catch (error) {
      next(error);
      return;
    }
  }
  async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
    // Validation
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = result.array();
      this.logger.error("Validation errors:", errors);
      res.status(400).json({ errors });
      return;
    }
    const { email, password } = req.body;
    this.logger.debug("New request to login a user", {
      email,
      password: "******",
    });

    try {
      // Check if email exists in database
      const user = await this.userService.findByEmailWithPassword(email);
      if (!user) {
        const error = createHttpError(400, "Email or password does not match");
        next(error);
        return;
      }
      // Compare password
      const passwordMatch = await this.credentialService.comparePassword(
        password,
        user.password,
      );
      if (!passwordMatch) {
        const error = createHttpError(400, "Email or password does not match");
        next(error);
        return;
      }
      // Generate tokens
      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
        tenant: user.tenant ? String(user.tenant.id) : "",
      };

      const accessToken = this.tokenService.generateAccessToken(payload);
      // Persist Refresh Token
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });
      // Add tokens to cookies
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
      this.logger.info("User has been logged in", { id: user.id });
      // Return the response
      res.json({ id: user.id });
    } catch (error) {
      next(error);
      return;
    }
  }
  async self(req: AuthRequest, res: Response) {
    const user = await this.userService.findById(Number(req.auth.sub));
    res.json({ ...user, password: undefined });
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payload: JwtPayload = {
        sub: String(req.auth.sub),
        role: req.auth.role,
        tenant: req.auth.tenant,
      };
      // TODO: add logger for token generation
      // TODO: move token generation logic to a method and use it DRY
      const accessToken = this.tokenService.generateAccessToken(payload);
      const user = await this.userService.findById(Number(req.auth.sub));
      if (!user) {
        const error = createHttpError(
          400,
          "User with the token could not find",
        );
        next(error);
        return;
      }
      // Persist Refresh Token
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);
      // Delete old refresh token
      await this.tokenService.deleteRefreshToken(Number(req.auth.id));

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });
      // Add tokens to cookies
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
      this.logger.info("User has been logged in", { id: user.id });
      // Return the response
      res.json({ id: user.id });
    } catch (error) {
      next(error);
      return;
    }
  }
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await this.tokenService.deleteRefreshToken(Number(req.auth.id));
      this.logger.info("Refresh token has been deleted", { id: req.auth.id });
      this.logger.info("User has been logged out", { id: req.auth.sub });
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.json({});
    } catch (error) {
      next(error);
      return;
    }
  }
}
