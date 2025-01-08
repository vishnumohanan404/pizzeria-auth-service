import { NextFunction, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../entity/RefreshToken";
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
      // let privateKey: Buffer;
      // try {
      //   privateKey = fs.readFileSync(
      //     path.join(__dirname, "../../certs/private.pem"),
      //   );
      // } catch {
      //   const err = createHttpError(500, "Error while reading private key");
      //   next(err);
      //   return;
      // }
      const payload: JwtPayload = {
        sub: String(savedUser.id),
        role: savedUser.role,
      };
      // const accessToken = sign(payload, privateKey, {
      //   algorithm: "RS256",
      //   expiresIn: "1h",
      //   issuer: "auth-service",
      // });
      const accessToken = this.tokenService.generateAccessToken(payload);
      // Persist Refresh Token
      const YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365;
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
      const newRefreshToken = await refreshTokenRepository.save({
        user: savedUser,
        expiresAt: new Date(Date.now() + YEAR_IN_MS),
      });

      // const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
      //   algorithm: "HS256",
      //   expiresIn: "1y",
      //   issuer: "auth-service",
      //   jwtid: String(newRefreshToken.id),
      // });
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
