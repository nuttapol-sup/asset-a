import mongoose, { Schema, InferSchemaType, Model } from 'mongoose';

export type UserRole = 'admin' | 'staff';

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['admin', 'staff'],
      default: 'staff',
    },
    department: { type: String, trim: true },
  },
  { timestamps: true }
);

export type IUser = InferSchemaType<typeof UserSchema> & { _id: string };

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
