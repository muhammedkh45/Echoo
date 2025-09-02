import { NextFunction, Request, Response } from "express";
import { json, ZodType } from "zod";
import { AppError } from "../utils/classError";
type reqTypes = keyof Request;
type schemaType = Partial<Record<reqTypes, ZodType>>;
const validation = (schema: schemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors = [];
    for (const key of Object.keys(schema) as reqTypes[]) {
      if (!schema[key]) continue;
      const result = schema[key]?.safeParse(req[key]);
      if (!result.success) {
        validationErrors.push(result.error);
      }
    }
    if (validationErrors.length) {
      throw new AppError(
        JSON.parse(validationErrors as unknown as string),
        422
      );
    }
    next();
  };
};

export default validation;
