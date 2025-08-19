"use client";

import { useState } from 'react';

interface EditEmployeeFormProps {
  onBack: () => void;
  onUpdateSuccess: () => void;
}

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  dob: string;
  dateOfJoining: string;
  permanentAddress: string;
  designation: string;
  department: string;
  roles: string[];
  salary: number;
  status: string;
  idCardFront?: string;
  idCardBack?: string;
  offerLetter?: string;
  createdAt: string;
  updatedAt: string;
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
  status: string;
  idCardFront: File | null;
  idCardBack: File | null;
  offerLetter: File | null;
}

const availableRoles = ['Sales', 'Billing'];

export default function EditEmployeeForm({ onBack, onUpdateSuccess }: EditEmployeeFormProps) {
  const [searchIdentifier, setSearchIdentifier] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showEditForm, setShowEditForm] = useState(false);
  
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
    status: 'active',
    idCardFront: null,
    idCardBack: null,
    offerLetter: null
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchIdentifier.trim()) {
      setMessage({ type: 'error', text: 'Please enter Employee ID or Email address.' });
      return;
    }

    setSearchLoading(true);
    setMessage({ type: '', text: '' });
    setEmployee(null);
    setShowEditForm(false);

    try {
      // Determine if the search is by email or employee ID
      const isEmail = searchIdentifier.includes('@');
      const searchType = isEmail ? 'email' : 'employeeId';
      
      const response = await fetch(
        `/api/employees/search?${searchType}=${encodeURIComponent(searchIdentifier.trim())}`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (response.ok) {
        if (data.employees && data.employees.length > 0) {
          const foundEmployee = data.employees[0];
          setEmployee(foundEmployee);
          
          // Initialize form data with found employee
          setFormData({
            employeeId: foundEmployee.employeeId || '',
            name: foundEmployee.name || '',
            email: foundEmployee.email || '',
            dob: foundEmployee.dob ? new Date(foundEmployee.dob).toISOString().split('T')[0] : '',
            dateOfJoining: foundEmployee.dateOfJoining ? new Date(foundEmployee.dateOfJoining).toISOString().split('T')[0] : '',
            permanentAddress: foundEmployee.permanentAddress || '',
            designation: foundEmployee.designation || '',
            department: foundEmployee.department || '',
            roles: foundEmployee.roles || [],
            salary: foundEmployee.salary ? foundEmployee.salary.toString() : '',
            status: foundEmployee.status || '',
            idCardFront: null,
            idCardBack: null,
            offerLetter: null
          });
          
          setShowEditForm(true);
          setMessage({ type: 'success', text: 'Employee found successfully! You can now edit their information.' });
        } else {
          setMessage({ type: 'error', text: 'No employee found with the provided Employee ID or Email.' });
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'An error occurred while searching.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while searching.' });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchIdentifier('');
    setEmployee(null);
    setShowEditForm(false);
    setMessage({ type: '', text: '' });
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
      
      // Append all form fields (including email if changed by admin)
      Object.entries(formData).forEach(([key, value]) => {
        
        if (key === 'roles') {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (value instanceof File) {
          if (value) {
            formDataToSend.append(key, value);
          }
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      // Add employee ID for identification
      formDataToSend.append('_id', employee!._id);

      const response = await fetch('/api/employees/update', {
        method: 'PUT',
        body: formDataToSend,
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Employee updated successfully!' });
        
        // Clear success message after 3 seconds and call success callback
        setTimeout(() => {
          setMessage({ type: '', text: '' });
          onUpdateSuccess();
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update employee.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR'
    }).format(salary);
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#091e65] to-[#dc2626] bg-clip-text text-transparent">
                  Edit Employee Account
                </h1>
                <p className="text-sm text-gray-600">Search by Employee ID or Email to edit</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="group relative px-6 py-3 text-gray-700 bg-white/70 hover:bg-white border border-gray-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center space-x-2"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back</span>
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

        {/* Search Form */}
        {!showEditForm && (
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-800">Search Employee to Edit</h2>
            </div>
            
            <form onSubmit={handleSearch} className="max-w-2xl">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Employee ID or Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchIdentifier}
                      onChange={(e) => setSearchIdentifier(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      placeholder="Enter Employee ID or Email"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Enter the employee's ID or email address to search and edit.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-6 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="relative px-6 py-3 bg-gradient-to-r from-[#091e65] to-[#dc2626] text-white rounded-xl hover:from-[#dc2626] hover:to-[#091e65] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    {searchLoading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Search</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Edit Form */}
        {showEditForm && employee && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-1 h-8 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-800">
                  Edit Employee: {employee.name}
                </h2>
              </div>
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
              >
                Search Another
              </button>
            </div>

            {/* Current Employee Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-blue-900">Current Employee Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-blue-600">Employee ID</p>
                    <p className="font-semibold text-blue-900">{employee.employeeId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-blue-600">Name</p>
                    <p className="font-semibold text-blue-900">{employee.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-blue-600">Email</p>
                    <p className="font-semibold text-blue-900">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-blue-600">Designation</p>
                    <p className="font-semibold text-blue-900">{employee.designation}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-blue-600">Department</p>
                    <p className="font-semibold text-blue-900">{employee.department}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-blue-600">Salary</p>
                    <p className="font-semibold text-blue-900">{formatSalary(employee.salary)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="text-sm text-blue-600">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
                  <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Employee ID (Read-only) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Employee ID
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Cannot be changed</p>
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

                  {/* Employee Email (Editable) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Employee Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Changing email will immediately sign the employee out and send them a notification. Their password remains the same.</p>
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
                  <h3 className="text-xl font-bold text-gray-800">Professional Information</h3>
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

                {/* Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Employee Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <p className="text-sm text-gray-500">Set employee account status</p>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
                  <h3 className="text-xl font-bold text-gray-800">Address Information</h3>
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
                  <h3 className="text-xl font-bold text-gray-800">Documents (Optional)</h3>
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
                    {employee.idCardFront && (
                      <p className="text-sm text-gray-500">Current: {employee.idCardFront.split('/').pop()}</p>
                    )}
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
                    {employee.idCardBack && (
                      <p className="text-sm text-gray-500">Current: {employee.idCardBack.split('/').pop()}</p>
                    )}
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
                  {employee.offerLetter && (
                    <p className="text-sm text-gray-500">Current: {employee.offerLetter.split('/').pop()}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-8 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClearSearch}
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
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Update Employee</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
