import mongoose from "mongoose";
import { AppError } from "../utils/classError";

const connectDB = async () => {
  mongoose
    .connect(process.env.DB_URI as unknown as string)
    .then(() => {
      console.log("Data base connected successfully");
    })
    .catch((error) => {
      throw new AppError(`Data base Error: ${error.message}`, 500);
    });
};
export default connectDB;
