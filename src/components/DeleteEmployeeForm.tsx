"use client";

import { useState } from 'react';

interface DeleteEmployeeFormProps {
  onBack: () => void;
  onDeleteSuccess: () => void;
}

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  status: string;
}

export default function DeleteEmployeeForm({ onBack, onDeleteSuccess }: DeleteEmployeeFormProps) {
  const [searchIdentifier, setSearchIdentifier] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchIdentifier.trim()) {
      setMessage({ type: 'error', text: 'Please enter Employee ID or Email address.' });
      return;
    }

    setSearchLoading(true);
    setMessage({ type: '', text: '' });
    setEmployee(null);

    try {
      // Determine if the search is by email or employee ID
      const isEmail = searchIdentifier.includes('@');
      const searchType = isEmail ? 'email' : 'employeeId';
      
      const response = await fetch(`/api/employees/search?${searchType}=${encodeURIComponent(searchIdentifier.trim())}`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (response.ok) {
        if (data.employees && data.employees.length > 0) {
          const foundEmployee = data.employees[0];
          setEmployee(foundEmployee);
          setMessage({ type: 'success', text: 'Employee found successfully! You can now delete their account.' });
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
    setMessage({ type: '', text: '' });
  };

  const handleDeleteClick = () => {
    if (!employee) return;
    
    if (employee.status === 'active') {
      setMessage({ 
        type: 'error', 
        text: 'Cannot delete active account. Please change status to inactive first, then delete.' 
      });
      return;
    }
    
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!employee) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/employees/delete/${employee._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        const summary = data.deletionSummary;
        const summaryText = `Employee deleted successfully! Deleted: ${summary.attendanceRecordsDeleted} attendance records, ${summary.passwordResetRequestsDeleted} password reset requests, ${summary.attendanceImageFilesDeleted} attendance images, and ${summary.employeeDocumentFilesDeleted} employee documents.`;
        
        setMessage({ type: 'success', text: summaryText });
        setShowDeleteModal(false);
        
        // Clear success message after 5 seconds and call success callback
        setTimeout(() => {
          setMessage({ type: '', text: '' });
          onDeleteSuccess();
        }, 5000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete employee.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Delete Employee Account</h2>
          <p className="text-gray-600">Remove employee from the system</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-100 border border-green-300 text-green-800'
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-[#091e65] mb-4">Search Employee to Delete</h3>
        
        <div className="max-w-sm">
          {/* Employee ID or Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID or Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchIdentifier}
                onChange={(e) => setSearchIdentifier(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-[#091e65] text-sm"
                placeholder="Enter Employee ID or Email"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter the employee's ID or email address to search and delete.
            </p>
          </div>
        </div>

        {/* Search Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 text-sm"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-4 py-2 bg-[#091e65] text-white rounded-md hover:bg-[#dc2626] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
          >
            {searchLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Employee Details */}
      {employee && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#091e65]">
              Employee Details
            </h3>
            <button
              onClick={handleClearSearch}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              Search Another
            </button>
          </div>

          {/* Employee Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <p className="text-lg font-semibold text-[#091e65]">{employee.employeeId}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-lg text-gray-900">{employee.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <p className="text-gray-700">{employee.email}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <p className="text-gray-700">{employee.designation}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <p className="text-gray-700">{employee.department}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  employee.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {employee.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Delete Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleDeleteClick}
              disabled={loading}
              className={`px-6 py-2 rounded-lg transition-colors duration-200 text-sm font-medium ${
                employee.status === 'active'
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : 'Delete Employee Account'}
            </button>
            
            {employee.status === 'active' && (
              <p className="text-sm text-yellow-600 mt-2">
                ⚠️ Active accounts cannot be deleted. Change status to inactive first.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && employee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{employee.name}</strong> ({employee.employeeId})? 
                This action cannot be undone and will remove all employee data.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
