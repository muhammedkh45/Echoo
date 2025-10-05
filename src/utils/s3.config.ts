import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { uuid } from "uuidv4";
import { storegeEnum } from "../middleware/multer.middleware";
import fs from "node:fs";
import { AppError } from "./classError";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export const s3client = () => {
  return new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
};

export const uploadFile = async ({
  storeType = storegeEnum.cloud,
  Bucket = process.env.AWS_BUCKET_NAME!,
  path = "general",
  ACL = "private" as ObjectCannedACL,
  file,
}: {
  storeType?: storegeEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path: string;
  file: Express.Multer.File;
}) => {
  const command = new PutObjectCommand({
    Bucket,
    ACL,
    Key: `${process.env.APPLICATION_NAME}/${path}/${
      uuid() + "_" + file.originalname
    }`,
    Body:
      storeType === storegeEnum.cloud
        ? file.buffer
        : fs.createReadStream(file.path),
    ContentType: file.mimetype,
  });
  await s3client().send(command);
  if (!command.input.Key) {
    throw new AppError("Failed to upload file to S3");
  }
  return command.input.Key;
};

export const uploadLargeFile = async ({
  storeType = storegeEnum.cloud,
  Bucket = process.env.AWS_BUCKET_NAME!,
  path = "general",
  ACL = "private" as ObjectCannedACL,
  file,
}: {
  storeType?: storegeEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path: string;
  file: Express.Multer.File;
}): Promise<string> => {
  const upload = new Upload({
    client: s3client(),
    params: {
      Bucket,
      ACL,
      Key: `${process.env.APPLICATION_NAME}/${path}/${
        uuid() + "_" + file.originalname
      }`,
      Body:
        storeType === storegeEnum.cloud
          ? file.buffer
          : fs.createReadStream(file.path),
      ContentType: file.mimetype,
    },
  });
  upload.on("httpUploadProgress", (progress) => {
    console.log(progress);
  });

  const { Key } = await upload.done();
  if (!Key) {
    throw new AppError("Failed to upload file to S3");
  }
  return Key;
};

export const uploadFiles = async ({
  path = "general",
  files,
  useLarge = false,
}: {
  path: string;
  files: Express.Multer.File[];
  useLarge?: boolean;
}) => {
  let urls: string[] = [];
  if (useLarge == true) {
    urls = await Promise.all(
      files.map((file) => uploadLargeFile({ file, path }))
    );
  } else {
    urls = await Promise.all(files.map((file) => uploadFile({ file, path })));
  }

  return urls;
};
export const createPresignedUrl = async ({
  Bucket = process.env.AWS_BUCKET_NAME!,
  originalname,
  ContentType,
  path = "general",
  expiresIn = 60 * 60,
}: {
  Bucket?: string;
  originalname: string;
  ContentType: string;
  path: string;
  expiresIn?: number;
}) => {
  const Key = `${process.env.APPLICATION_NAME}/${path}/${
    uuid() + "_" + originalname
  }`;
  const command = new PutObjectCommand({
    Bucket,
    Key,
    ContentType,
  });
  const url = await getSignedUrl(s3client(), command, {
    expiresIn,
  });
  return { url, Key };
};

export const getFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME!,
  Key,
}: {
  Bucket?: string;
  Key: string;
}) => {
  const command = new GetObjectCommand({ Bucket, Key });
  return await s3client().send(command);
};

export const getFilePreSignedUrl = async ({
  Bucket = process.env.AWS_BUCKET_NAME!,
  Key,
  expiresIn = 60,
  downloadName,
}: {
  Bucket?: string;
  Key: string;
  expiresIn?: number;
  downloadName?: string;
}) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
    ResponseContentDisposition: downloadName
      ? `attachment; filename="${downloadName}"`
      : undefined,
  });
  return await getSignedUrl(s3client(), command, { expiresIn });
};

export const deleteFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME!,
  Key,
}: {
  Bucket?: string;
  Key: string;
}) => {
  const command = new DeleteObjectCommand({ Bucket, Key });
  return await s3client().send(command);
};

export const deleteFiles = async ({
  Bucket = process.env.AWS_BUCKET_NAME!,
  Keys,
  Quiet = false,
}: {
  Bucket?: string;
  Keys: string[];
  Quiet?: boolean;
}) => {
  const command = new DeleteObjectsCommand({
    Bucket,
    Delete: {
      Objects: Keys.map((key) => ({ Key: key })),
      Quiet,
    },
  });
  return await s3client().send(command);
};

export const listFiles = async ({
  Bucket = process.env.AWS_BUCKET_NAME!,
  path,
}: {
  Bucket?: string;
  path: string;
}) => {
  const command = new ListObjectsV2Command({
    Bucket,
    Prefix: `${Bucket}/${path}`,
  });
  return await s3client().send(command);
};
