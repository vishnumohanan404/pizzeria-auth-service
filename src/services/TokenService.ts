import { JwtPayload, sign } from "jsonwebtoken";
import createHttpError from "http-errors";
import { Config } from "../config";
import { RefreshToken } from "../entity/RefreshToken";
import { User } from "../entity/User";
import { Repository } from "typeorm";

export class TokenService {
  constructor(private refreshTokenRepository: Repository<RefreshToken>) {}
  generateAccessToken(payload: JwtPayload) {
    let privateKey: string;
    if (!Config.PRIVATE_KEY) {
      const err = createHttpError(500, "SECRET_KEY is not set");
      throw err;
    }
    try {
      privateKey = Config.PRIVATE_KEY;
    } catch {
      const err = createHttpError(500, "Error while reading private key");
      throw err;
    }
    const accessToken = sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: "1h",
      issuer: "auth-service",
    });

    return accessToken;
  }

  generateRefreshToken(payload: JwtPayload) {
    const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
      algorithm: "HS256",
      expiresIn: "1y",
      issuer: "auth-service",
      jwtid: String(payload.id),
    });

    return refreshToken;
  }

  async persistRefreshToken(user: User) {
    // Persist Refresh Token
    const YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365;

    const newRefreshToken = await this.refreshTokenRepository.save({
      user: user,
      expiresAt: new Date(Date.now() + YEAR_IN_MS),
    });
    return newRefreshToken;
  }
  async deleteRefreshToken(tokenId: number) {
    return await this.refreshTokenRepository.delete({ id: tokenId });
  }
}
