import { Request, Response, NextFunction } from "express";
import { RoleType } from "../DB/model/user.model";

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
