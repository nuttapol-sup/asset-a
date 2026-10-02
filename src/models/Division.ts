import mongoose, { Schema, InferSchemaType, Model } from 'mongoose';

const DivisionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    subDivisions: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

export type IDivision = InferSchemaType<typeof DivisionSchema> & { _id: string };

const Division: Model<IDivision> =
  mongoose.models.Division || mongoose.model<IDivision>('Division', DivisionSchema);

export default Division;
