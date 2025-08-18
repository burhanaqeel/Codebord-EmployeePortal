import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: string;
  employeeName: string;
  date: Date;
  clockInTime: Date;
  clockOutTime?: Date;
  clockInImage: string;
  clockOutImage?: string;
  totalHours?: number;
  status: 'present' | 'absent' | 'late';
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    trim: true
  },
  employeeName: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  clockInTime: {
    type: Date,
    required: [true, 'Clock in time is required']
  },
  clockOutTime: {
    type: Date,
    default: null
  },
  clockInImage: {
    type: String,
    required: [true, 'Clock in image is required']
  },
  clockOutImage: {
    type: String,
    default: null
  },
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  }
}, {
  timestamps: true
});

// Index for efficient queries
AttendanceSchema.index({ employeeId: 1, date: 1 });
AttendanceSchema.index({ date: 1 });

// Calculate total hours when clock out time is set
AttendanceSchema.pre('save', function(next) {
  if (this.clockOutTime && this.clockInTime) {
    const diffMs = this.clockOutTime.getTime() - this.clockInTime.getTime();
    this.totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }
  next();
});

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
