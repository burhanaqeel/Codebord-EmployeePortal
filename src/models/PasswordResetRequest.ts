import mongoose, { Schema, Document } from 'mongoose';

export interface IPasswordResetRequest extends Document {
  employeeId: string;
  email: string;
  name: string;
  department?: string;
  designation?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetRequestSchema = new Schema<IPasswordResetRequest>({
  employeeId: { type: String, required: true, index: true },
  email: { type: String, required: true, lowercase: true, index: true },
  name: { type: String, required: true },
  department: { type: String, default: '' },
  designation: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
}, { timestamps: true });

// Only one active pending request per employeeId
PasswordResetRequestSchema.index({ employeeId: 1, status: 1 });

export default mongoose.models.PasswordResetRequest || mongoose.model<IPasswordResetRequest>('PasswordResetRequest', PasswordResetRequestSchema);


