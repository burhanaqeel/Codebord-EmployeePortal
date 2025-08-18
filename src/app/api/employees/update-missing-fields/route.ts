import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Require admin
    const auth = await requireAdmin(request);
    if ('response' in auth) return auth.response;
    // Connect to MongoDB
    await connectDB();

    // Find all employees that might be missing fields
    const employees = await Employee.find({});
    
    let updatedCount = 0;
    
    for (const employee of employees) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Check and set missing fields
      if (!employee.dob) {
        updates.dob = new Date('1990-01-01'); // Default DOB
        needsUpdate = true;
      }
      
      if (!employee.dateOfJoining) {
        updates.dateOfJoining = employee.createdAt || new Date();
        needsUpdate = true;
      }
      
      if (!employee.permanentAddress) {
        updates.permanentAddress = 'Address not provided';
        needsUpdate = true;
      }
      
      if (!employee.salary || employee.salary === 0) {
        updates.salary = 50000; // Default salary
        needsUpdate = true;
      }
      
      if (!employee.roles || employee.roles.length === 0) {
        updates.roles = [];
        needsUpdate = true;
      }
      
      if (!employee.idCardFront) {
        updates.idCardFront = '';
        needsUpdate = true;
      }
      
      if (!employee.idCardBack) {
        updates.idCardBack = '';
        needsUpdate = true;
      }
      
      if (!employee.offerLetter) {
        updates.offerLetter = '';
        needsUpdate = true;
      }
      
      // Update employee if needed
      if (needsUpdate) {
        await Employee.findByIdAndUpdate(employee._id, updates);
        updatedCount++;
      }
    }
    
    return NextResponse.json({
      message: `Updated ${updatedCount} employees with missing fields`,
      updatedCount
    });
    
  } catch (error: any) {
    console.error('Error updating missing fields:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
