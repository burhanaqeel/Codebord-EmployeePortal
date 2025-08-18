"use client";

import { useState } from 'react';

interface ViewEmployeeHistoryProps {
  onBack: () => void;
}

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockInTime: string;
  clockOutTime?: string | null;
  clockInImage?: string | null;
  clockOutImage?: string | null;
  clockInImageUrl?: string | null;
  clockOutImageUrl?: string | null;
  totalHours?: number | null;
  status: 'present' | 'absent' | 'late';
}

export default function ViewEmployeeHistory({ onBack }: ViewEmployeeHistoryProps) {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: '' | 'success' | 'error'; text: string }>({ type: '', text: '' });
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageTitle, setSelectedImageTitle] = useState<string>('');

  const fetchHistory = async () => {
    if (!identifier.trim()) {
      setMessage({ type: 'error', text: 'Please enter Employee ID or Email.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    setHistory([]);

    try {
      const params = new URLSearchParams({ identifier: identifier.trim(), all: 'true' });
      const response = await fetch(`/api/attendance/history?${params.toString()}`, { credentials: 'include' });
      const data = await response.json();

      if (response.ok) {
        setHistory(Array.isArray(data.attendanceHistory) ? data.attendanceHistory : []);
        setMessage({ type: 'success', text: `Found ${data.count || 0} record(s).` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch attendance history.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const openImage = (pathOrUrl: string | null | undefined, title: string) => {
    if (!pathOrUrl) return;
    
    // If it's already a full URL (starts with /api/), use it directly
    if (pathOrUrl.startsWith('/api/attendance/images/')) {
      setSelectedImage(pathOrUrl);
      setSelectedImageTitle(title);
      setShowImageModal(true);
      return;
    }
    
    // If it's a file path, extract the filename and construct the API URL
    const parts = pathOrUrl.split('/');
    const filename = parts[parts.length - 1];
    if (filename) {
      const url = `/api/attendance/images/${filename}`;
      setSelectedImage(url);
      setSelectedImageTitle(title);
      setShowImageModal(true);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return String(dateStr);
    }
  };

  const formatHours = (hours: number | null | undefined) => {
    if (hours === null || hours === undefined) return '-';
    return `${hours.toFixed(2)} hrs`;
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#091e65] to-[#dc2626] bg-clip-text text-transparent">
                  Employee Attendance History
                </h1>
                <p className="text-sm text-gray-600">Search and view employee attendance records</p>
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

        {/* Search Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800">Search Attendance History</h2>
          </div>
          
          <div className="max-w-2xl">
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
                    placeholder="Enter Employee ID or Email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Enter the employee's ID or email address to search attendance history.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={fetchHistory}
                  disabled={loading}
                  className="relative px-6 py-3 bg-gradient-to-r from-[#091e65] to-[#dc2626] text-white rounded-xl hover:from-[#dc2626] hover:to-[#091e65] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Search History</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        {history.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-800">Attendance Records</h2>
            </div>

            <div className="space-y-6">
              {history.map((rec) => (
                <div key={rec._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  {/* Record Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#091e65] to-[#dc2626] rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{formatDate(rec.date)}</h3>
                        <p className="text-sm text-gray-600">Attendance Record</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      rec.status === 'present'
                        ? 'bg-green-100 text-green-800'
                        : rec.status === 'late'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {rec.status}
                    </span>
                  </div>

                  {/* Time Details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <p className="text-sm text-gray-600">Clock In</p>
                      </div>
                      <p className="font-semibold text-gray-800">{formatDate(rec.clockInTime)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <p className="text-sm text-gray-600">Clock Out</p>
                      </div>
                      <p className="font-semibold text-gray-800">{rec.clockOutTime ? formatDate(rec.clockOutTime) : '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <p className="text-sm text-gray-600">Total Hours</p>
                      </div>
                      <p className="font-semibold text-gray-800">{formatHours(rec.totalHours)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <p className="text-sm text-gray-600">Employee</p>
                      </div>
                      <p className="font-semibold text-gray-800">{rec.employeeName || rec.employeeId}</p>
                    </div>
                  </div>

                  {/* Images Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-1 h-6 bg-gradient-to-b from-[#091e65] to-[#dc2626] rounded-full"></div>
                      <h4 className="text-lg font-bold text-gray-800">Attendance Images</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Clock In Image */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-700">Clock In Image</p>
                        </div>
                        
                        {rec.clockInImage || rec.clockInImageUrl ? (
                          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <img
                              src={(rec.clockInImageUrl || rec.clockInImage) as string}
                              alt="Clock In"
                              className="w-full h-48 object-scale-down bg-white transition-all duration-300 hover:scale-105"
                              onError={(e) => {
                                console.error('Failed to load clock in image:', rec.clockInImageUrl || rec.clockInImage);
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            {/* Fallback for failed images */}
                            <div className="hidden w-full h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <div className="text-center">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm text-gray-500">Image Not Available</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <div className="text-center">
                              <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-sm text-gray-500">No Image</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Clock Out Image */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-700">Clock Out Image</p>
                        </div>
                        
                        {rec.clockOutImage || rec.clockOutImageUrl ? (
                          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <img
                              src={(rec.clockOutImageUrl || rec.clockOutImage) as string}
                              alt="Clock Out"
                              className="w-full h-48 object-scale-down bg-white transition-all duration-300 hover:scale-105"
                              onError={(e) => {
                                console.error('Failed to load clock out image:', rec.clockOutImageUrl || rec.clockOutImage);
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            {/* Fallback for failed images */}
                            <div className="hidden w-full h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <div className="text-center">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm text-gray-500">Image Not Available</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <div className="text-center">
                              <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-sm text-gray-500">No Image</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Records Message */}
        {!loading && history.length === 0 && message.type === 'success' && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Attendance Records Found</h3>
            <p className="text-gray-600">No attendance records found for the specified employee.</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-[#091e65]">{selectedImageTitle}</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-[#dc2626] transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <img 
                src={selectedImage} 
                alt={selectedImageTitle} 
                className="w-full max-h-[70vh] object-contain rounded-xl" 
                onError={(e) => {
                  console.error('Failed to load image in modal:', selectedImage);
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              {/* Fallback for failed modal images */}
              <div className="hidden w-full h-96 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Image Not Available</h4>
                  <p className="text-gray-600">The requested image could not be loaded.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


