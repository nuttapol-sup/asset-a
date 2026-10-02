import mongoose, { Schema, InferSchemaType, Model } from 'mongoose';

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

export type ICategory = InferSchemaType<typeof CategorySchema> & { _id: string };

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
