import { Request, Response, NextFunction } from "express";
import { RoleType } from "../DB/model/user.model";
import { GraphQLError } from "graphql";

export const Authorization = ({
  accessRoles = [],
}: {
  accessRoles: RoleType[];
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!accessRoles.includes(req.user?.role!)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
};
export const AuthorizationGQL = ({
  accessRoles = [],
  role,
}: {
  accessRoles: RoleType[];
  role: RoleType;
}) => {
  if (!accessRoles.includes(role)) {
    throw new GraphQLError("Unauthorized", {
      extensions: { statusCode: 401 },
    });
  }
  return true;
};
