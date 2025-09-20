import { AppError } from "../utils/classError";
import { NextFunction, Request, Response } from "express";
import {
  decodeTokenAndFetchUser,
  getSignature,
  TokenType,
} from "../utils/Security/Token";

export const Authentication = (tokenType: TokenType = TokenType.access) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    if (!authorization) {
      throw new AppError("Authorization header missing", 401);
    }
    const [prefix, token] = authorization.split(" ");

    if (!prefix || !token) {
      throw new AppError("Token not exist.", 401);
    }
    const signature = await getSignature(tokenType, prefix);
    if (!signature) {
      throw new AppError("Invalid Token", 400);
    }
    const decoded = await decodeTokenAndFetchUser(token, signature);
    if (!decoded) {
      throw new AppError("Invalid token decoded", 400);
    }
    req.user = decoded.user;
    req.decoded = decoded.decoded;
    return next();
  };
};
