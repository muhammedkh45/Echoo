import { Model } from "mongoose";
import { DBRepository } from "./db.repository";
import { IFriendRequest } from "../model/friendRequest.model";

export class FriendRequestRepository extends DBRepository<IFriendRequest> {
  constructor(protected readonly model: Model<IFriendRequest>) {
    super(model);
  }
}
