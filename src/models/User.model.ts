import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name?: string;
  picture?: string;
  role: string;
  googleId?: string;
  lastLoggedIn?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    picture: { type: String },
    role: { type: String, default: "user" },
    googleId: { type: String, unique: true, sparse: true },
    lastLoggedIn: { type: Date },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);

export default UserModel;
