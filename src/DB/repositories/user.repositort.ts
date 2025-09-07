import { HydratedDocument, Model, RootFilterQuery } from "mongoose";
import { DBRepository } from "./db.repository";
import { IUser } from "../model/user.model";
import { AppError } from "../../utils/classError";
import { ProjectionType } from "mongoose";
import { overwrite } from "zod";

export class UserRepository extends DBRepository<IUser> {
  constructor(protected readonly model: Model<IUser>) {
    super(model);
  }
  async createOneUser(data: Partial<IUser>): Promise<HydratedDocument<IUser>> {
    try {
      const user = this.model.create(data);
      if (!user) {
        throw new AppError("Could not create user.", 500);
      }
      return user;
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).cause
      );
    }
  }
}
