import jwt from "jsonwebtoken";

export const generateToken = async (
  payload: object,
  secretKey: string,
  options?: jwt.SignOptions
) => {
  return jwt.sign(payload, secretKey, options);
};
