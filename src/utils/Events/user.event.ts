import { EventEmitter } from "events";
import { set } from "mongoose";
import { deleteFile, getFile } from "../s3.config";
import { UserRepository } from "../../DB/repositories/user.repository";
import userModel from "../../DB/model/user.model";

const eventEmitter = new EventEmitter();
const _userModel = new UserRepository(userModel);
eventEmitter.on("uploadImage", async (data) => {
  const { userId, oldKey, Key, expiresIn } = data;

  setTimeout(async () => {
    try {
      await getFile({ Key });
      await _userModel.findOneAndUpdate(
        { _id: userId },
        { $unset: { tempProfileImage: "" } }
      );
      if (oldKey) {
        await deleteFile({ Key: oldKey });
      }
    } catch (error: any) {
      if (error?.Code == "NoSuchKey") {
        if (!oldKey) {
          await _userModel.findOneAndUpdate(
            { _id: userId },
            { $unset: { profileImage: "" } }
          );
        } else {
          await _userModel.findOneAndUpdate(
            { _id: userId },
            { $set: { profileImage: oldKey }, $unset: { tempProfileImage: "" } }
          );
        }
      }
    }
  }, expiresIn * 1000);
});
