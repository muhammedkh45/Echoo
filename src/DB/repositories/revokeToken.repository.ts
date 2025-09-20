import { DBRepository } from "./db.repository";
import { IRevoke } from "../model/revokeToken.model";
import { Model } from "mongoose";

export class RevokeTokenRepository extends DBRepository<IRevoke> {
  constructor(protected readonly model: Model<IRevoke>) {
    super(model);
  }

}
