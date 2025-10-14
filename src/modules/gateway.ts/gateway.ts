import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { AppError } from "../../utils/classError";
import {
  decodeTokenAndFetchUser,
  getSignature,
} from "../../utils/Security/Token";
import { ChatGateWay } from "../chat/chat.gateway";
export const connectionSockets = new Map<string, string[]>();

let io: Server | undefined = undefined;

export const initializeGateway = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket: Socket, next) => {
    try {
      const { authorization } = socket.handshake.auth;
      const [prefix, token] = authorization?.split(" ") || [];
      if (!prefix || !token) {
        throw new AppError("Token not Found", 404);
      }
      const signature = await getSignature(token, prefix);
      if (!signature) {
        throw new AppError("Invalid signature", 400);
      }
      const { decoded, user } = await decodeTokenAndFetchUser(token, signature);
      if (!decoded) {
        throw new AppError("Invalid token decoded", 400);
      }
      const socketIds = connectionSockets.get(user._id.toString()) || [];
      socketIds?.push(socket.id);
      connectionSockets.set(user._id.toString(), socketIds);
      socket.data.user = user;
      return next();
    } catch (error: any) {
      next(error);
    }
  });

  const chatGateway: ChatGateWay = new ChatGateWay();

  io.on("connection", (socket: Socket) => {
    chatGateway.register(socket, getIo());
    function removeSocket() {
      const remainingSocketsIds = connectionSockets
        .get(socket.data.user._id.toString())
        ?.filter((socketId) => socketId !== socket.id);
      if (remainingSocketsIds?.length) {
        connectionSockets.set(
          socket.data.user._id.toString(),
          remainingSocketsIds
        );
      } else {
        connectionSockets.delete(socket.data.user._id.toString());
      }
      getIo().emit("offline_user", socket.data.user._id.toString());
    }
    socket.on("disconnect", () => {
      removeSocket();
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new AppError("IO not intialized", 400);
  }
  return io;
};
