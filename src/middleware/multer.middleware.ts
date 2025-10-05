import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import { uuid } from "uuidv4";
import os from "node:os";
import { AppError } from "../utils/classError";
export const fileValidation = {
    image: ["image/png", "image/jpg", "image/jpeg"],
    video: ["video/mp4", "video/mkv"],
    audio: ["audio/mpeg", "audio/mp3"],
    file: ["application/pdf", "application/msword"],
};

export enum storegeEnum {
        local = "local",
        cloud = "cloud",
}
export const multerCloud = ({
        fileTypes = fileValidation.image,
        storeType = storegeEnum.cloud,
}: {
    fileTypes?: string[];
    storeType?: storegeEnum;
}) => {
    const storage =
    storeType === storegeEnum.cloud
        ? multer.memoryStorage()
        : multer.diskStorage({
            destination: os.tmpdir(),
            filename(req: Request, file: Express.Multer.File, cb) {
            cb(null, `${uuid()}_${file.originalname}`);
            },
        });
  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (fileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      return cb(new AppError("inValid file type", 400));
    }
  };
  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 },
  });
  return upload;
};
