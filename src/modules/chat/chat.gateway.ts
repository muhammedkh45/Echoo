import { Server, Socket } from "socket.io";
import { ChatEvents } from "./chat.event";

export class ChatGateWay {
  private _chatEvents: ChatEvents = new ChatEvents();
  constructor() {}
  register = (socket: Socket, io: Server) => {
    this._chatEvents.sayHi(socket, io);
    this._chatEvents.sendMessage(socket, io);
    this._chatEvents.sendGroupMessage(socket, io);
    this._chatEvents.joinRoom(socket, io);
  };
}
