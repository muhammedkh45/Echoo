import { Model } from "mongoose";
import { DBRepository } from "./db.repository";
import { IChat } from "../model/chat.model";

export class ChatRepository extends DBRepository<IChat> {
  constructor(protected readonly model: Model<IChat>) {
    super(model);
  }
}
