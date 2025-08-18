"use client";

import { useEffect, useState } from 'react';

interface PasswordResetRequest {
  _id: string;
  employeeId: string;
  email: string;
  name: string;
  department?: string;
  designation?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface PasswordResetRequestsProps {
  onBack: () => void;
}

export default function PasswordResetRequests({ onBack }: PasswordResetRequestsProps) {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: '' | 'success' | 'error'; text: string }>({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const fetchRequests = async (status: 'pending' | 'approved' | 'rejected' = activeTab) => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/admin/password-requests?status=${status}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load requests' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests('pending');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApproveReject = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/password-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Request updated successfully' });
        fetchRequests(activeTab);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update request' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    }
  };

  const switchTab = (tab: 'pending' | 'approved' | 'rejected') => {
    setActiveTab(tab);
    fetchRequests(tab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Glass Effect */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-[#091e65] rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#091e65]">
                  Password Reset Requests
                </h1>
                <p className="text-sm text-gray-600">Manage employee password reset requests</p>
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

        {/* Modern Tabs */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-1 h-8 bg-[#091e65] rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800">Request Status</h2>
          </div>
          
          <div className="flex items-center space-x-1 bg-white/50 backdrop-blur-sm rounded-2xl p-1 border border-gray-200/50">
            {(['pending', 'approved', 'rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-[#091e65] text-white shadow-lg'
                    : 'text-gray-600 hover:text-[#091e65] hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  {tab === 'pending' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {tab === 'approved' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {tab === 'rejected' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-6">
          {loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#091e65] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Loading requests...</p>
            </div>
          )}

          {!loading && requests.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No {activeTab} requests</h3>
              <p className="text-gray-600">There are currently no {activeTab} password reset requests.</p>
            </div>
          )}

          {requests.map((req) => (
            <div key={req._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-[#091e65] rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {req.name.split(' ').map(p => p[0]).slice(0,2).join('')}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold text-gray-800">{req.name}</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        activeTab === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : activeTab === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {activeTab}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#091e65] rounded-full"></div>
                          <span className="text-gray-600">Employee ID:</span>
                          <span className="font-semibold text-gray-800">{req.employeeId}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#dc2626] rounded-full"></div>
                          <span className="text-gray-600">Email:</span>
                          <span className="font-semibold text-gray-800">{req.email}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#091e65] rounded-full"></div>
                          <span className="text-gray-600">Designation:</span>
                          <span className="font-semibold text-gray-800">{req.designation || '-'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#dc2626] rounded-full"></div>
                          <span className="text-gray-600">Department:</span>
                          <span className="font-semibold text-gray-800">{req.department || '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Requested: {new Date(req.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {activeTab === 'pending' && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleApproveReject(req._id, 'approve')}
                      className="px-6 py-3 bg-[#091e65] text-white rounded-xl hover:bg-[#091e65]/90 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleApproveReject(req._id, 'reject')}
                      className="px-6 py-3 bg-[#dc2626] text-white rounded-xl hover:bg-[#dc2626]/90 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


