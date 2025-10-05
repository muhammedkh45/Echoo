import { Model } from "mongoose";
import { IPost } from "../model/post.model";
import { DBRepository } from "./db.repository";

export class PostRepository extends DBRepository<IPost> {
  constructor(protected readonly model: Model<IPost>) {
    super(model);
  }
}
