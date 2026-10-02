import mongoose, { Schema, InferSchemaType, Model } from 'mongoose';

export type AssetStatus = 'ปกติ' | 'ชำรุด' | 'รอซ่อม' | 'แทงจำหน่าย' | 'ถูกยืม';

const AssetSchema = new Schema(
  {
    assetCode: { type: String, required: true, unique: true, trim: true },
    secondaryAssetCode: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    price: { type: Number, required: true, default: 0 },
    purchaseDate: { type: Date },
    location: { type: String, required: true, trim: true },
    custodian: { type: String, required: true, trim: true },
    division: { type: String, trim: true }, // ชื่อกอง / สำนัก / ศูนย์
    subDivision: { type: String, trim: true }, // ส่วนราชการ / ฝ่าย / ส่วน / กลุ่ม
    status: {
      type: String,
      enum: ['ปกติ', 'ชำรุด', 'รอซ่อม', 'แทงจำหน่าย', 'ถูกยืม'],
      default: 'ปกติ',
    },
    usefulLifeYears: { type: Number, default: 5 },
    salvageValue: { type: Number, default: 1 },
    description: { type: String },
    imageUrl: { type: String, trim: true },

    // Soft Delete & Audit Trail
    deleteFlag: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    deletedBy: { type: String, trim: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export type IAsset = InferSchemaType<typeof AssetSchema> & { _id: string };

const Asset: Model<IAsset> =
  mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);

export default Asset;
