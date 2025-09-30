import mongoose, { Schema, InferSchemaType } from 'mongoose';

const recordSchema = new Schema({
  userEmail: { type: String, index: true },
  data: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });

export type Record = InferSchemaType<typeof recordSchema>;
export const RecordModel = mongoose.model<Record>('Record', recordSchema);



