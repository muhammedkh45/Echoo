import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";

export class ChatEvents {
  private _chatService: ChatService = new ChatService();
  constructor() {}
  sayHi = (socket: Socket, io: Server) => {
    return socket.on("sayHi", (data) => {
      this._chatService.sayHi(data, socket, io);
    });
  };
  sendMessage = (socket: Socket, io: Server) => {
    return socket.on("sendMessage", (data) => {
      this._chatService.sendMessage(data, socket, io);
    });
  };
  joinRoom = (socket: Socket, io: Server) => {
    return socket.on("joinRoom", (data) => {
      this._chatService.joinRoom(data, socket, io);
    });
  };
  sendGroupMessage = (socket: Socket, io: Server) => {
    return socket.on("sendGroupMessage", (data) => {
      this._chatService.sendGroupMessage(data, socket, io);
    });
  };
}
