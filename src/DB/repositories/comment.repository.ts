import { Model } from "mongoose";
import { DBRepository } from "./db.repository";
import { IComment } from "../model/comment.model";

export class CommentRepository extends DBRepository<IComment> {
  constructor(protected readonly model: Model<IComment>) {
    super(model);
  }
}
