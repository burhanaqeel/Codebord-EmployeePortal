"use client";

import { useState, useEffect } from 'react';

interface Admin {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  isSuperAdmin?: boolean;
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export default function AdminListTable() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string>('');
  const [currentIsSuperAdmin, setCurrentIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; admin: Admin | null }>({ show: false, admin: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/list', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
        setCurrentAdminId(data.currentAdminId || '');
        const me = (data.admins || []).find((a: Admin) => a._id === data.currentAdminId);
        setCurrentIsSuperAdmin(Boolean(me?.isSuperAdmin));
        setLastUpdated(new Date().toLocaleString());
      } else {
        setError('Failed to fetch admin list');
      }
    } catch (error) {
      setError('An error occurred while fetching admin list');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteModal.admin) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/delete/${deleteModal.admin._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Admin deleted successfully!' });
        setDeleteModal({ show: false, admin: null });
        fetchAdmins(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete admin' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while deleting admin' });
    } finally {
      setDeleteLoading(false);
    }

    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleStatus = async (admin: Admin) => {
    const next = admin.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/update-status/${admin._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      });
      const data = await res.json();
      if (res.ok) {
        setAdmins((prev) => prev.map((a) => a._id === admin._id ? { ...a, status: next as 'active' | 'inactive' } : a));
        setMessage({ type: 'success', text: `Status updated to ${next}` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update status' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#091e65]"></div>
          <span className="ml-3 text-gray-600">Loading admins...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Admins</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAdmins}
            className="px-4 py-2 bg-[#091e65] text-white rounded-lg hover:bg-[#dc2626] transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-8 bg-[#091e65] rounded-full"></div>
            <h1 className="text-2xl font-bold text-[#091e65]">Admin Users</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchAdmins}
              disabled={loading}
              className={`px-4 py-2 bg-[#091e65] text-white rounded-lg hover:bg-[#1e40af] transition-colors duration-200 flex items-center space-x-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            {currentIsSuperAdmin && (
              <div className="px-3 py-1 rounded-full bg-[#091e65]/10 text-[#091e65] border border-[#091e65]/20 text-xs font-semibold">
                You are Super Admin
              </div>
            )}
            <div className="px-4 py-2 bg-[#dc2626] text-white rounded-full text-sm font-medium">
              {admins.length} Admin{admins.length !== 1 ? 's' : ''}
            </div>
            {currentIsSuperAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
              >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className="px-6 py-4">
          <div className={`p-4 rounded-lg shadow-md ${
            message.type === 'success'
              ? 'bg-green-100 border border-green-300 text-green-800'
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
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
              <button
                onClick={() => setMessage({ type: '', text: '' })}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-6 py-6">
        {admins.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Admins Found</h3>
            <p className="text-gray-600">No admin users have been created yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#091e65]">
                  <th className="text-left py-4 px-4 font-bold text-[#091e65] text-lg">Admin</th>
                  <th className="text-left py-4 px-4 font-bold text-[#091e65] text-lg">Email</th>
                  <th className="text-left py-4 px-4 font-bold text-[#091e65] text-lg">Created</th>
                  <th className="text-left py-4 px-4 font-bold text-[#091e65] text-lg">Last Updated</th>
                  <th className="text-left py-4 px-4 font-bold text-[#091e65] text-lg">Role</th>
                  <th className="text-left py-4 px-4 font-bold text-[#091e65] text-lg">Status</th>
                  <th className="text-left py-4 px-4 font-bold text-[#091e65] text-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, index) => (
                  <tr 
                    key={admin._id} 
                    className={`border-b border-gray-200 hover:bg-white/50 transition-all duration-200 ${
                      index === admins.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                                       <td className="py-6 px-4">
                     <div className="flex items-center space-x-4">
                       {admin.profileImage ? (
                         <img 
                           src={admin.profileImage}
                           alt={admin.name}
                           className="w-12 h-12 rounded-full object-cover border-2 border-[#091e65]"
                           onError={(e) => {
                             (e.currentTarget as HTMLImageElement).style.display = 'none';
                             e.currentTarget.nextElementSibling?.classList.remove('hidden');
                           }}
                           onLoad={(e) => {
                             e.currentTarget.nextElementSibling?.classList.add('hidden');
                           }}
                         />
                       ) : null}
                       <div className={`w-12 h-12 bg-[#091e65] rounded-full flex items-center justify-center ${admin.profileImage ? 'hidden' : ''}`}>
                         <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                         </svg>
                       </div>
                       <div>
                         <p className="font-bold text-gray-800 text-lg">{admin.name}</p>
                         <p className="text-sm text-gray-500">Administrator</p>
                       </div>
                     </div>
                   </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-[#091e65]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700 font-medium">{admin.email}</span>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-[#091e65]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700 font-medium">{formatDate(admin.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-[#091e65]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700 font-medium">{formatDate(admin.updatedAt)}</span>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {admin.isSuperAdmin ? 'Super Admin' : 'Admin'}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {admin.status || 'active'}
                        </span>
                        {currentIsSuperAdmin && !admin.isSuperAdmin && admin._id !== currentAdminId && (
                          <button
                            onClick={() => toggleStatus(admin)}
                            className="px-2 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50"
                          >
                            {admin.status === 'active' ? 'Set Inactive' : 'Set Active'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-2">
                        {!admin.isSuperAdmin && currentIsSuperAdmin && admin._id !== currentAdminId && (
                          <button
                            onClick={() => setDeleteModal({ show: true, admin })}
                            className="px-3 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {admins.length > 0 && (
          <div className="mt-8 pt-6 border-t-2 border-[#091e65]">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="font-medium">Showing {admins.length} admin user{admins.length !== 1 ? 's' : ''}</span>
              <span className="font-medium">Last updated: {lastUpdated || '—'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.admin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-96 max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Admin Account</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold text-[#091e65]">{deleteModal.admin.name}</span>? 
                This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteModal({ show: false, admin: null })}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAdmin}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateModal && currentIsSuperAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-96 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create Admin</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Name</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Admin name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Password"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={(e) => setCreateForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Confirm password"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                disabled={creating}
                onClick={async () => {
                  setCreating(true);
                  try {
                    const res = await fetch('/api/admin/register', {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(createForm),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setMessage({ type: 'success', text: 'Admin created successfully' });
                      setShowCreateModal(false);
                      setCreateForm({ name: '', email: '', password: '', confirmPassword: '' });
                      fetchAdmins();
                    } else {
                      setMessage({ type: 'error', text: data.error || 'Failed to create admin' });
                    }
                  } catch {
                    setMessage({ type: 'error', text: 'Failed to create admin' });
                  } finally {
                    setCreating(false);
                    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
