import { AppError } from "../utils/classError";
import { NextFunction, Request, Response } from "express";
import {
  decodeTokenAndFetchUser,
  getSignature,
  TokenType,
} from "../utils/Security/Token";
import { GraphQLError } from "graphql";

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
export const AuthenticationGQL = async (
  authorization: string,
  tokenType: TokenType = TokenType.access
) => {
  if (!authorization) {
    throw new GraphQLError("Authorization header missing", {
      extensions: { statusCode: 401 },
    });
  }
  const [prefix, token] = authorization.split(" ");

  if (!prefix || !token) {
    throw new GraphQLError("Token not exist.", {
      extensions: { statusCode: 401 },
    });
  }
  const signature = await getSignature(tokenType, prefix);
  if (!signature) {
    throw new GraphQLError("Invalid Token", {
      extensions: { statusCode: 401 },
    });
  }
  const decoded = await decodeTokenAndFetchUser(token, signature);
  if (!decoded) {
    throw new GraphQLError("Invalid token decoded", {
      extensions: { statusCode: 401 },
    });
  }
  return { user: decoded.user, decoded: decoded.decoded };
};
