import { NextFunction, Request, Response } from "express";
import { Server, Socket } from "socket.io";
import { AppError } from "../../utils/classError";
import { UserRepository } from "../../DB/repositories/user.repository";
import userModel from "../../DB/model/user.model";
import { ChatRepository } from "../../DB/repositories/chat.repository";
import { chatModel, IChat } from "../../DB/model/chat.model";
import { connectionSockets } from "../gateway.ts/gateway";
import { Types } from "mongoose";
import { deleteFile, uploadFile } from "../../utils/s3.config";
import { uuidv4 } from "zod";
import { uuid } from "uuidv4";

export class ChatService {
  private _userModel = new UserRepository(userModel);
  private _chatModel = new ChatRepository(chatModel);
  constructor() {}
  /* =================Rest APi===============*/
  getChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      let { page, limit } = req.query as unknown as {
        page: number;
        limit: number;
      };
      if (page < 0) page = 1;
      page = page * 1 || 1;
      limit = limit * 1 || 5;

      const chat = await this._chatModel.findOne(
        {
          participants: { $all: [userId, req.user?._id] },
          group: { $exists: false },
        },
        { messages: { $slice: [-(page * limit), 5] } },
        {
          populate: [
            {
              path: "participants",
            },
          ],
        }
      );
      if (!chat) {
        throw new AppError("Chat not found", 404);
      }
      res.status(200).json({ message: `Success`, chat });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  createGroupChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let { group, groupImage, participants } = req.body;
      const createdBy = req.user?._id;
      const dbParticipants = participants.map((participants: string) =>
        Types.ObjectId.createFromHexString(participants)
      );
      const users = await this._userModel.find({
        filter: { _id: { $in: dbParticipants }, friends: { $in: [createdBy] } },
      });
      if (users.length !== dbParticipants.length) {
        throw new AppError("Invalid participants", 400);
      }
      const roomId = group.replaceAll(/\s+/g, "-") + "_" + uuid();
      if (req?.file) {
        groupImage = await uploadFile({
          path: `chat/${roomId}`,
          file: req.file as Express.Multer.File,
        });
      }
      dbParticipants.push(createdBy!);
      const newChat = await this._chatModel.create({
        group,
        groupImage,
        participants: dbParticipants,
        createdBy,
        roomId,
        messages: [],
      });
      if (!newChat) {
        if (groupImage) {
          await deleteFile({
            Key: groupImage,
          });
        }
        throw new AppError("Chat not created", 500);
      }
      res.status(201).json({ message: "Success", newChat });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  getGroupChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { groupId } = req.params;
      const chat = await this._chatModel.findOne(
        {
          _id: groupId,
          participants: { $in: [req.user?._id] },
          group: { $exists: true },
        },
        {
          populate: [
            {
              path: "messages.createdBy",
            },
          ],
        }
      );
      if (!chat) {
        throw new AppError("Chat not found", 404);
      }
      res.status(200).json({ message: "Success", chat });
    } catch (error) {
      throw new AppError(
        (error as unknown as any).message,
        (error as unknown as any).statusCode
      );
    }
  };
  /* =================SocketIO===============*/
  sayHi = (data: any, socket: Socket, io: Server) => {
    console.log({ data });
    socket.emit("sayHiBack", { message: "Hi from Backend" });
  };
  sendMessage = async (data: any, socket: Socket, io: Server) => {
    const { content, sendTo } = data;
    const createdBy = socket.data.user._id;
    const user = await this._userModel.findOne({
      _id: sendTo,
      friends: { $in: [createdBy] },
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const chat = await this._chatModel.findOneAndUpdate(
      {
        participants: { $all: [sendTo, createdBy] },
        group: { $exists: false },
      },
      {
        $push: {
          messages: { content, createdBy },
        },
      }
    );
    if (!chat) {
      const newChat = await this._chatModel.create({
        participants: [createdBy, sendTo],
        messages: [{ content, createdBy }],
        createdBy,
      });
      if (!newChat) {
        throw new AppError("chat not created", 500);
      }
    }
    io.to(connectionSockets.get(createdBy.toString())!).emit("sucessMessage", {
      content,
    });
    io.to(connectionSockets.get(sendTo.toString())!).emit("newMessage", {
      content,
      from: socket.data.user,
    });
  };
  sendGroupMessage = async (data: any, socket: Socket, io: Server) => {
    const { content, groupId } = data;
    const createdBy = socket.data.user._id;
    
    const chat = await this._chatModel.findOneAndUpdate(
      {
        _id: groupId,
        participants: { $all: [ createdBy] },
        group: { $exists: true },
      },
      {
        $push: {
          messages: { content, createdBy },
        },
      }
    );
    if (!chat) {
      throw new AppError("chat not found", 404);
    }
    io.to(connectionSockets.get(createdBy.toString())!).emit("sucessMessage", {
      content,
    });
    io.to(chat?.roomId!).emit("newMessage", {
      content,
      from: socket.data.user,
      groupId: chat?._id,
    });
  };
  joinRoom = async (data: any, socket: Socket, io: Server) => {
    console.log(data);
    const { roomId } = data;
    const chat = await this._chatModel.findOne({
      roomId,
      participants: { $in: [socket.data.user._id] },
      group: { $exists: true },
    });
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    socket.join(chat?.roomId!);
  };
  
}

export default new ChatService();
