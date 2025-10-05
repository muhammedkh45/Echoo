import mongoose, { Types } from "mongoose";
import { Hash } from "../../utils/Security/Hash";
import { eventEmitter } from "../../utils/Events/Email.event";
import { HydratedDocument } from "mongoose";
import { generateOTP } from "../../utils/Security/OTPGenerator";

export enum GenderType {
  male = "male",
  female = "female",
}

export enum RoleType {
  user = "user",
  admin = "admin",
}
export enum ProviderType {
  system = "system",
  google = "google",
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
  changeCredentials?: Date;
  image?: string;
  provider: ProviderType;
  profileImage?: string;
  tempProfileImage?: string;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
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
    password: {
      type: String,
      required: function () {
        return this.provider === ProviderType.google ? false : true;
      },
    },
    age: {
      type: Number,
      required: function () {
        return this.provider === ProviderType.google ? false : true;
      },
      min: 18,
    },
    address: { type: String },
    phone: { type: String },
    gender: {
      type: String,
      enum: GenderType,
      required: function () {
        return this.provider === ProviderType.google ? false : true;
      },
    },
    role: { type: String, enum: RoleType },
    isVerified: { type: Boolean, required: true, default: false },
    otp: { type: String, minLength: 6, maxLength: 6 },
    otpExpires: {
      type: Date,
      default: Date.now() + 10 * 60 * 1000,
    },
    changeCredentials: { type: Date },
    image: { type: String },
    provider: {
      type: String,
      enum: ProviderType,
      default: ProviderType.system,
    },
    profileImage: { type: String },
    tempProfileImage: { type: String },
    deletedAt: { types: Date },
    deletedBy: { types: Types.ObjectId, ref: "User" },
    restoredAt: { types: Date },
    restoredBy: { types: Types.ObjectId, ref: "User" },
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
// hooks must have next as middlewar or make it async so it auto resolve the next middleware
// --> got excuted before DB validation
userSchema.pre(
  "save",
  async function (this: HydratedDocument<IUser> & { NEW: boolean }, next) {
    this.NEW = this.isNew;
    if (this.isModified("password")) {
      this.password = await Hash(this.password);
    }
  }
);

userSchema.post("save", async function (next) {
  const that = this as HydratedDocument<IUser> & { NEW: boolean };
  const otp = await generateOTP();
  if (that.NEW == true) {
    eventEmitter.emit("sendEmail", {
      email: this.email,
      OTP: otp,
      subject: "Confirm email",
    });
  }
});

const userModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default userModel;
