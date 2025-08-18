"use client";

import { useState } from 'react';

interface SearchEmployeeFormProps {
  onBack: () => void;
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

export default function SearchEmployeeForm({ onBack }: SearchEmployeeFormProps) {
  const [searchIdentifier, setSearchIdentifier] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showResults, setShowResults] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ type: string; url: string; title: string } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchIdentifier.trim()) {
      setMessage({ type: 'error', text: 'Please enter Employee ID or Email address.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    setEmployee(null);
    setShowResults(false);

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
          setEmployee(data.employees[0]); // Get the first (and should be only) result
          setShowResults(true);
          setMessage({ type: 'success', text: 'Employee found successfully!' });
        } else {
          setMessage({ type: 'error', text: 'No employee found with the provided Employee ID or Email.' });
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'An error occurred while searching.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while searching.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchIdentifier('');
    setEmployee(null);
    setShowResults(false);
    setMessage({ type: '', text: '' });
  };

  const handleViewDocument = (documentType: string, documentUrl: string) => {
    const titles = {
      idCardFront: 'ID Card Front',
      idCardBack: 'ID Card Back',
      offerLetter: 'Offer Letter'
    };
    
    setSelectedDocument({
      type: documentType,
      url: documentUrl,
      title: titles[documentType as keyof typeof titles]
    });
    setShowDocumentModal(true);
  };

  const handleDownloadDocument = async (documentUrl: string, documentTitle: string) => {
    try {
      // If it's a Cloudinary URL, open in new tab for download directly
      if (documentUrl.startsWith('http')) {
        window.open(documentUrl, '_blank');
      } else {
        // Legacy local path fallback goes through API which now redirects to Cloudinary if found
        const filename = documentUrl.split('/').pop();
        if (!filename) {
          setMessage({ type: 'error', text: 'Invalid document URL' });
          return;
        }
        const downloadUrl = `/api/employees/documents/${encodeURIComponent(filename)}`;
        window.open(downloadUrl, '_blank');
      }
      
      // Show success message
      setMessage({ type: 'success', text: `Download started for ${documentTitle}` });
      
      // Close the modal
      setShowDocumentModal(false);
      setSelectedDocument(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Download error:', error);
      setMessage({ type: 'error', text: 'Failed to download document. Please try again.' });
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#091e65] to-[#dc2626] bg-clip-text text-transparent">
                  Search Employee
                </h1>
                <p className="text-sm text-gray-600">Search by Employee ID or Email</p>
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
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800">Search Employee</h2>
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
                  Enter the employee's ID or email address to search.
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
                  disabled={loading}
                  className="relative px-6 py-3 bg-gradient-to-r from-[#091e65] to-[#dc2626] text-white rounded-xl hover:from-[#dc2626] hover:to-[#091e65] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  {loading ? (
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

        {/* Search Results */}
        {showResults && employee && (
          <div className="space-y-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-800">Employee Details</h2>
            </div>

            {/* Employee Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-800">Basic Information</h3>
                  </div>
                  
                  <div className="bg-gradient-to-r from-[#091e65] to-[#dc2626] rounded-2xl p-6 text-white shadow-lg">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm opacity-80">Employee ID</p>
                          <p className="font-bold text-lg">{employee.employeeId}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm opacity-80">Full Name</p>
                          <p className="font-semibold">{employee.name}</p>
                        </div>
                        <div>
                          <p className="text-sm opacity-80">Email Address</p>
                          <p className="font-semibold">{employee.email}</p>
                        </div>
                        <div>
                          <p className="text-sm opacity-80">Date of Birth</p>
                          <p className="font-semibold">{formatDate(employee.dob)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employment Details */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-800">Employment Details</h3>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Designation</p>
                          <p className="font-semibold text-[#091e65]">{employee.designation}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="font-semibold text-[#091e65]">{employee.department}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Date of Joining</p>
                          <p className="font-semibold text-[#091e65]">{formatDate(employee.dateOfJoining)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Salary</p>
                          <p className="font-semibold text-[#dc2626]">{formatSalary(employee.salary)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            employee.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      {employee.roles.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Roles</p>
                          <div className="flex flex-wrap gap-2">
                            {employee.roles.map((role, index) => (
                              <span key={index} className="px-3 py-1 bg-gradient-to-r from-[#091e65] to-[#dc2626] text-white text-sm rounded-lg font-medium">
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Address Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-800">Address Information</h3>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#091e65]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Permanent Address</p>
                        <p className="font-semibold text-[#091e65] mt-1">{employee.permanentAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-800">Documents</h3>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="space-y-4">
                      {[
                        { key: 'idCardFront', label: 'ID Card Front', icon: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' },
                        { key: 'idCardBack', label: 'ID Card Back', icon: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' },
                        { key: 'offerLetter', label: 'Offer Letter', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
                      ].map((doc) => (
                        <div key={doc.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#091e65] rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={doc.icon} />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">{doc.label}</p>
                              <p className="text-xs text-gray-500">
                                {employee[doc.key as keyof Employee] ? 'Uploaded' : 'Not uploaded'}
                              </p>
                            </div>
                          </div>
                          {employee[doc.key as keyof Employee] && (
                            <button
                              onClick={() => handleViewDocument(doc.key, employee[doc.key as keyof Employee] as string)}
                              className="px-3 py-1 bg-gradient-to-r from-[#091e65] to-[#dc2626] text-white text-xs rounded-lg hover:from-[#dc2626] hover:to-[#091e65] transition-all duration-200 font-medium"
                            >
                              View
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-800">Account Information</h3>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Account Created</p>
                          <p className="font-semibold text-[#091e65]">{formatDate(employee.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Last Updated</p>
                          <p className="font-semibold text-[#091e65]">{formatDate(employee.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document View Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-[#091e65]">{selectedDocument.title}</h3>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDocument(null);
                }}
                className="text-gray-400 hover:text-[#dc2626] transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-[#091e65] to-[#dc2626] rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-[#091e65] mb-2">{selectedDocument.title}</h4>
                <p className="text-gray-600 mb-2">Document uploaded successfully</p>
                <p className="text-sm text-gray-500 mb-2">File: {selectedDocument.url.split('/').pop()}</p>
                <p className="text-xs text-gray-400 mb-6">Click Download to get the actual uploaded file</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => handleDownloadDocument(selectedDocument.url, selectedDocument.title)}
                    className="px-6 py-3 bg-gradient-to-r from-[#091e65] to-[#dc2626] text-white rounded-xl hover:from-[#dc2626] hover:to-[#091e65] transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => {
                      setShowDocumentModal(false);
                      setSelectedDocument(null);
                    }}
                    className="px-6 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
