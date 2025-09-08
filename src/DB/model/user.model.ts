import mongoose, { Types } from "mongoose";

export enum GenderType {
  male = "male",
  female = "female",
}

export enum RoleType {
  user = "user",
  admin = "admin",
}
export interface IUser {
  _id: Types.ObjectId;
  fName: string;
  lName: string;
  userName?: string;
  email: string;
  password: string;
  age: number;
  address?: string;
  phone?: string;
  gender: GenderType;
  role?: RoleType;
  createdAt: Date;
  updatedAt: Date;
  isVerified?: boolean;
  otp?: string;
  otpExpires?: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    fName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 15,
      trim: true,
    },
    lName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 15,
      trim: true,
    },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    age: { type: Number, required: true, min: 18 },
    address: { type: String },
    phone: { type: String },
    gender: { type: String, enum: GenderType, required: true },
    role: { type: String, enum: RoleType },
    isVerified: { type: Boolean, required: true, default: false },
    otp: { type: String, minLength: 6, maxLength: 6 },
    otpExpires: {
      type: Date,
      default: Date.now() + 10 * 60 * 1000,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

userSchema
  .virtual("userName")
  .set(function (value) {
    const [fName, lName] = value.split(" ");
    this.set({ fName, lName });
  })
  .get(function () {
    return this.fName + " " + this.lName;
  });

const userModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default userModel;
