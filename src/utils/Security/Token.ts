import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../classError";
import { UserRepository } from "../../DB/repositories/user.repository";
import userModel from "../../DB/model/user.model";
import { RevokeTokenRepository } from "../../DB/repositories/revokeToken.repository";
import revokeTokenModel from "../../DB/model/revokeToken.model";

export enum TokenType {
  access = "access",
  refresh = "refresh",
}
const _userModel = new UserRepository(userModel);
const _revokeTokenModel = new RevokeTokenRepository(revokeTokenModel);

export const generateToken = async (
  payload: object,
  secretKey: string,
  options?: jwt.SignOptions
): Promise<string> => {
  return jwt.sign(payload, secretKey, options);
};

export const verifyToken = async (
  token: string,
  signature: string
): Promise<JwtPayload> => {
  return jwt.verify(token, signature) as JwtPayload;
};

export const getSignature = async (tokenType: TokenType, prefix: string) => {
  if (tokenType === TokenType.access) {
    if (prefix.toLowerCase() === "bearer") {
      return process.env.JWT_USER_SECRET;
    } else if (prefix.toLowerCase() === "admin") {
      return process.env.JWT_ADMIN_SECRET;
    }
  } else if (tokenType === TokenType.refresh) {
    if (prefix.toLowerCase() === "bearer") {
      return process.env.JWT_USER_SECRET_REFRESH;
    } else if (prefix.toLowerCase() === "admin") {
      return process.env.JWT_ADMIN_SECRET_REFRESH;
    }
  }
  return null;
};

export const decodeTokenAndFetchUser = async (
  token: string,
  signature: string
) => {
  const decoded: JwtPayload = await verifyToken(token, signature!);
  if (!decoded.email) {
    throw new AppError("InValid Token", 400);
  }
  if (await _revokeTokenModel.findOne({ tokenId: decoded.jti })) {
    throw new AppError("Token has been revoked", 401);
  }

  const user = await _userModel.findOne({ email: decoded.email });
  if (user?.changeCredentials?.getTime()! > decoded?.iat! * 1000) {
    throw new AppError("Token has been revoked", 401);
  }
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return { decoded, user };
};
