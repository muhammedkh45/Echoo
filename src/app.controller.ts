import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import dotenv from "dotenv";
import path from "node:path";
import { AppError } from "./utils/classError";
import userRouter from "./modules/users/users.controller";
import postRouter from "./modules/posts/posts.controller";
import connectDB from "./DB/connection.db";
import { Server } from "socket.io";
import { initializeGateway } from "./modules/gateway.ts/gateway";
import chatRouter from "./modules/chat/chat.controller";
import { createHandler } from "graphql-http";
import { schemaGQL } from "./modules/GraphQL/Schema.gql";
import { Authentication } from "./middleware/authentication.meddleware";
dotenv.config({ path: path.resolve("config/.env") });
const app: express.Application = express();
const port: string | number = process.env.PORT || 5000;
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  message: {
    error: "Game Over",
  },
  statusCode: 429,
  skipSuccessfulRequests: true,
  legacyHeaders: false,
});
const bootstrap = async () => {
  app.all(
    "/gql",
    Authentication(),
    createHandler({
      schema: schemaGQL,
      context: (req) =>({req}),
    })
  );
  app.use(express.json(), helmet(), cors(), limiter);
  await connectDB();
  app.get("/", (req: Request, res: Response) =>
    res.status(200).json({ message: "Hello World!" })
  );
  app.use("/users", userRouter);
  app.use("/posts", postRouter);
  app.use("/chats", chatRouter);
  app.use("{/*demo}", (req: Request, res: Response) => {
    // return res
    //   .status(404)
    //   .json({ message: `path ${req.originalUrl} not found` });
    throw new AppError(`path ${req.originalUrl} not found`, 404);
  });
  app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message, stack: err.stack });
  });
  const server = app.listen(port, () =>
    console.log(`Example app listening on port ${port}!`)
  );

  initializeGateway(server);
};

export default bootstrap;
