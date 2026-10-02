import mongoose, { Schema, InferSchemaType, Model } from 'mongoose';

export type BorrowStatus = 'กำลังยืม' | 'คืนแล้ว' | 'เกินกำหนด';

const BorrowRecordSchema = new Schema(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    borrowerName: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    borrowDate: { type: Date, required: true, default: Date.now },
    expectedReturnDate: { type: Date, required: true },
    actualReturnDate: { type: Date },
    status: {
      type: String,
      enum: ['กำลังยืม', 'คืนแล้ว', 'เกินกำหนด'],
      default: 'กำลังยืม',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export type IBorrowRecord = InferSchemaType<typeof BorrowRecordSchema> & { _id: string };

const BorrowRecord: Model<IBorrowRecord> =
  mongoose.models.BorrowRecord ||
  mongoose.model<IBorrowRecord>('BorrowRecord', BorrowRecordSchema);

export default BorrowRecord;
