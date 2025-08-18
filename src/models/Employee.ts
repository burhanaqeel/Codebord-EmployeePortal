import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IEmployee extends mongoose.Document {
  employeeId: string;
  name: string;
  email: string;
  password: string;
  tokenVersion?: number;
  profileImage?: string;
  dob: Date;
  dateOfJoining: Date;
  permanentAddress: string;
  designation: string;
  department: string;
  roles: string[];
  salary: number;
  status: string;
  idCardFront?: string;
  idCardBack?: string;
  offerLetter?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const employeeSchema = new mongoose.Schema<IEmployee>({
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true,
    maxlength: [100, 'Employee name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    default: '00000000' // Default password as requested
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  dateOfJoining: {
    type: Date,
    required: [true, 'Date of joining is required']
  },
  permanentAddress: {
    type: String,
    required: [true, 'Permanent address is required'],
    trim: true,
    default: ''
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  roles: {
    type: [String],
    default: [],
    enum: {
      values: ['Sales', 'Billing'],
      message: 'Role must be either Sales or Billing'
    }
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: [0, 'Salary cannot be negative'],
    default: 0
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['active', 'inactive'],
      message: 'Status must be either active or inactive'
    },
    default: 'active'
  },
  profileImage: {
    type: String,
    default: ''
  },
  idCardFront: {
    type: String,
    default: ''
  },
  idCardBack: {
    type: String,
    default: ''
  },
  offerLetter: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Token version for session invalidation (optional field)
employeeSchema.add({ tokenVersion: { type: Number, default: 0 } });

// Hash password before saving (always when modified)
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    return next(error);
  }
});

// Method to compare password
employeeSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Prevent password from being returned in queries
employeeSchema.methods.toJSON = function() {
  const employeeObject = this.toObject();
  delete employeeObject.password;
  return employeeObject;
};

// Note: Indexes are automatically created by the 'unique: true' property
// on employeeId and email fields, so we don't need to declare them explicitly

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', employeeSchema);
