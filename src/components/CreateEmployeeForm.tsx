"use client";

import { useState, useEffect } from 'react';

interface CreateEmployeeFormProps {
  onBack: () => void;
}

interface EmployeeFormData {
  employeeId: string;
  name: string;
  email: string;
  dob: string;
  dateOfJoining: string;
  permanentAddress: string;
  designation: string;
  department: string;
  roles: string[];
  salary: string;
  idCardFront: File | null;
  idCardBack: File | null;
  offerLetter: File | null;
  profileImage: File | null;
}

const availableRoles = ['Sales', 'Billing'];

export default function CreateEmployeeForm({ onBack }: CreateEmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    employeeId: '',
    name: '',
    email: '',
    dob: '',
    dateOfJoining: '',
    permanentAddress: '',
    designation: '',
    department: '',
    roles: [],
    salary: '',
    idCardFront: null,
    idCardBack: null,
    offerLetter: null,
    profileImage: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Generate employee ID on component mount
  useEffect(() => {
    generateEmployeeId();
  }, []);

  const generateEmployeeId = async () => {
    try {
      const response = await fetch('/api/employees/next-id', { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setFormData(prev => ({ ...prev, employeeId: data.nextId }));
      }
    } catch (error) {
      console.error('Error generating employee ID:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof EmployeeFormData) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'roles') {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (value instanceof File) {
          if (value) {
            formDataToSend.append(key, value);
          }
        } else {
          formDataToSend.append(key, value);
        }
      });

      const response = await fetch('/api/employees/create', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Employee account created successfully! Login credentials have been automatically sent to ${formData.email}. The employee will receive their Employee ID, email, and a secure randomly generated password.` 
        });
        
        // Reset form
        setFormData({
          employeeId: '',
          name: '',
          email: '',
          dob: '',
          dateOfJoining: '',
          permanentAddress: '',
          designation: '',
          department: '',
          roles: [],
          salary: '',
          idCardFront: null,
          idCardBack: null,
          offerLetter: null,
          profileImage: null
        });
        
        // Generate new employee ID
        generateEmployeeId();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Glass Effect */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#091e65] to-[#dc2626] rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#091e65] to-[#dc2626] bg-clip-text text-transparent">
                  Create Employee Account
                </h1>
                <p className="text-sm text-gray-600">Add a new employee to the system</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="group relative px-6 py-3 text-gray-700 bg-white/70 hover:bg-white border border-gray-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center space-x-2"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Employees</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Display */}
        {message.text && (
          <div className={`mb-8 p-4 rounded-2xl border-l-4 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-400 text-green-800'
              : 'bg-red-50 border-red-400 text-red-800'
          }`}>
            <div className="flex items-center space-x-3">
              {message.type === 'success' ? (
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Info Alert */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">Auto-Generated Password</h3>
              <p className="text-blue-800">
                A secure random password will be automatically generated and sent to the employee's email address. 
                <span className="font-medium ml-1">(Employee can change this after first login)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modern Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Employee ID */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Employee ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-mono text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Auto-generated</p>
              </div>

              {/* Employee Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Employee Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="Enter employee name"
                />
              </div>

              {/* Employee Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="Enter email address"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                />
              </div>

              {/* Date of Joining */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Date of Joining *
                </label>
                <input
                  type="date"
                  name="dateOfJoining"
                  value={formData.dateOfJoining}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                />
              </div>

              {/* Salary */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Monthly Salary (PKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₨</span>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                    placeholder="Enter monthly salary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-800">Professional Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Designation */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Designation *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="e.g., Software Engineer"
                />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Department *
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="e.g., IT Department"
                />
              </div>
            </div>

            {/* Roles */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Employee Roles (Optional)
              </label>
              <div className="flex flex-wrap gap-4">
                {availableRoles.map(role => (
                  <label key={role} className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role)}
                        onChange={() => handleRoleChange(role)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        formData.roles.includes(role)
                          ? 'bg-[#091e65] border-[#091e65]'
                          : 'border-gray-300 group-hover:border-[#091e65]'
                      }`}>
                        {formData.roles.includes(role) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-[#091e65] transition-colors duration-200">{role}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-800">Address Information</h2>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Permanent Address *
              </label>
              <textarea
                name="permanentAddress"
                value={formData.permanentAddress}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-200 hover:border-gray-300 resize-none"
                placeholder="Enter complete permanent address"
              />
            </div>
          </div>

          {/* Documents Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-800">Documents (Optional)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Card Front */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ID Card Front
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'idCardFront')}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-[#091e65] transition-all duration-200 hover:border-gray-300 cursor-pointer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-500">Choose file</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ID Card Back */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ID Card Back
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'idCardBack')}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-[#091e65] transition-all duration-200 hover:border-gray-300 cursor-pointer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-500">Choose file</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Offer Letter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Offer Letter
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 'offerLetter')}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-[#091e65] transition-all duration-200 hover:border-gray-300 cursor-pointer"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">Choose PDF or Word document</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={onBack}
              className="px-8 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="relative px-8 py-3 bg-gradient-to-r from-[#091e65] to-[#dc2626] text-white rounded-xl hover:from-[#dc2626] hover:to-[#091e65] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Employee Account</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
