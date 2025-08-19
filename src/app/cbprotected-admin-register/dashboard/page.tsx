"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import CreateEmployeeForm from '@/components/CreateEmployeeForm';
import SearchEmployeeForm from '@/components/SearchEmployeeForm';
import EditEmployeeForm from '@/components/EditEmployeeForm';
import DeleteEmployeeForm from '@/components/DeleteEmployeeForm';
import ViewEmployeeHistory from '@/components/ViewEmployeeHistory';
import EmployeesListTable from '@/components/EmployeesListTable';
import PasswordResetRequests from '@/components/PasswordResetRequests';
import AdminListTable from '@/components/AdminListTable';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('admins');
  const [showPasswordDropdown, setShowPasswordDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Profile image state changes (silent)
  useEffect(() => {
  }, [profileImage]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showMobileChangePassword, setShowMobileChangePassword] = useState(false);
  
  // Employee management states
  const [showCreateEmployee, setShowCreateEmployee] = useState(false);
  const [showSearchEmployee, setShowSearchEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showDeleteEmployee, setShowDeleteEmployee] = useState(false);
  const [showEmployeeHistory, setShowEmployeeHistory] = useState(false);
  const [showPasswordRequests, setShowPasswordRequests] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  
  const router = useRouter();
  const { admin, updateAdminData, logout, isAuthenticated, isLoading } = useAdmin();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated (only after loading is complete)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/cbprotected-admin-register/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load profile image from admin data
  useEffect(() => {
    if (admin?.profileImage) {
      setProfileImage(admin.profileImage);
    } else {
      setProfileImage(null);
    }
  }, [admin]);

  // Profile image state changes (silent)
  useEffect(() => {
  }, [profileImage]);

  // Poll pending password request count when Employees tab is active
  useEffect(() => {
    let interval: any;
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/admin/password-requests?status=pending', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) {
          setPendingRequestsCount(typeof data.pendingCount === 'number' ? data.pendingCount : 0);
        }
      } catch {
        // ignore
      }
    };
    if (activeTab === 'employees' && !showPasswordRequests && !showEmployeeHistory && !showCreateEmployee && !showSearchEmployee && !showEditEmployee && !showDeleteEmployee) {
      fetchCount();
      interval = setInterval(fetchCount, 10000);
    }
    return () => interval && clearInterval(interval);
  }, [activeTab, showPasswordRequests, showEmployeeHistory, showCreateEmployee, showSearchEmployee, showEditEmployee, showDeleteEmployee]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPasswordDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    logout();
    router.push('/cbprotected-admin-register/login');
  };

  const handleProfileImageClick = () => {
    setShowProfileModal(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setProfileMessage({ type: 'error', text: 'Please select a valid image file' });
        setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setProfileMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
        return;
      }

      setIsUploadingImage(true);
      setProfileMessage({ type: '', text: '' });

      try {
        const form = new FormData();
        form.append('profileImage', file);
        
        const response = await fetch('/api/admin/profile-image', {
          method: 'POST',
          body: form,
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
          console.log('Profile image updated successfully in database');
          console.log('Updated admin data:', data.admin);
          
          // Use direct Cloudinary URL
          setProfileImage(data.admin.profileImage || null);
          updateAdminData(data.admin);
          setProfileMessage({ type: 'success', text: 'Profile image uploaded successfully!' });
          setShowProfileModal(false);
        } else {
          setProfileMessage({ type: 'error', text: data.error || 'Failed to save profile image' });
        }
      } catch (error) {
        setProfileMessage({ type: 'error', text: 'Failed to save profile image to database' });
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setProfileMessage({ type: '', text: '' });
      }, 3000);
          } else {
        console.log('No file selected');
      }
      
      setIsUploadingImage(false);
  };

  const handleRemoveImage = async () => {
    try {
      // Remove from database
      const response = await fetch('/api/admin/profile-image', {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Profile image removed successfully from database');
        setProfileImage(null);
        updateAdminData(data.admin);
        setProfileMessage({ type: 'success', text: 'Profile image removed successfully!' });
        setShowProfileModal(false);
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to remove profile image' });
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'Failed to remove profile image from database' });
    }
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setProfileMessage({ type: '', text: '' });
    }, 3000);
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }
    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Current password is required' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          currentPassword,
          newPassword 
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordDropdown(false);
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setPasswordMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setPasswordMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Employee management handlers
  const handleBackToEmployees = () => {
    setShowCreateEmployee(false);
    setShowSearchEmployee(false);
    setShowEditEmployee(false);
    setShowDeleteEmployee(false);
    setShowEmployeeHistory(false);
    setShowPasswordRequests(false);
  };

  const handleUpdateSuccess = () => {
    setShowEditEmployee(false);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteEmployee(false);
  };

  // Show loading while checking authentication
  if (!isAuthenticated || !admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#091e65] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'admins':
        return (
          <div className="p-6">
            <AdminListTable />
          </div>
        );
      case 'employees':
        if (showCreateEmployee) {
          return <CreateEmployeeForm onBack={handleBackToEmployees} />;
        }
        if (showSearchEmployee) {
          return (
            <SearchEmployeeForm 
              onBack={handleBackToEmployees}
            />
          );
        }
        if (showEditEmployee) {
          return (
            <EditEmployeeForm 
              onBack={handleBackToEmployees}
              onUpdateSuccess={handleUpdateSuccess}
            />
          );
        }
        if (showDeleteEmployee) {
          return (
            <DeleteEmployeeForm 
              onBack={handleBackToEmployees}
              onDeleteSuccess={handleDeleteSuccess}
            />
          );
        }
        if (showEmployeeHistory) {
          return <ViewEmployeeHistory onBack={handleBackToEmployees} />;
        }
        if (showPasswordRequests) {
          return <PasswordResetRequests onBack={handleBackToEmployees} />;
        }
        return (
          <div className="p-6">
            <div className="bg-gradient-to-r from-[#0f1e59] via-[#1f3a8a] to-[#dc2626] rounded-2xl p-8 mb-6 shadow-xl border border-white/10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Employee Management</h2>
                  <p className="text-white/80">Manage your workforce efficiently</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create Employee Account */}
              <div 
                className="group bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer transform"
                onClick={() => setShowCreateEmployee(true)}
              >
                <div className="flex items-center space-x-4 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#091e65] to-[#dc2626] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#091e65] transition-colors duration-300">Create Employee Account</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">Add new employees to the system with complete profile information and role assignments.</p>
                <div className="mt-4 flex items-center text-[#091e65] text-sm font-medium group-hover:text-[#dc2626] transition-colors duration-300">
                  <span>Get Started</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Search Employee */}
              <div 
                className="group bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer transform"
                onClick={() => setShowSearchEmployee(true)}
              >
                <div className="flex items-center space-x-4 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#091e65] to-[#dc2626] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#091e65] transition-colors duration-300">Search Employee</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">Search employee by ID or email to view complete details and edit information.</p>
                <div className="mt-4 flex items-center text-[#091e65] text-sm font-medium group-hover:text-[#dc2626] transition-colors duration-300">
                  <span>Search Employee</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Edit Employee Account */}
              <div 
                className="group bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer transform"
                onClick={() => setShowEditEmployee(true)}
              >
                <div className="flex items-center space-x-4 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#091e65] to-[#dc2626] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#091e65] transition-colors duration-300">Edit Employee Account</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">Search employee by ID or email to edit their complete profile information.</p>
                <div className="mt-4 flex items-center text-[#091e65] text-sm font-medium group-hover:text-[#dc2626] transition-colors duration-300">
                  <span>Search to Edit</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

                             {/* Delete Employee Account */}
               <div 
                 className="group bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer transform"
                 onClick={() => setShowDeleteEmployee(true)}
               >
                <div className="flex items-center space-x-4 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#091e65] to-[#dc2626] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#091e65] transition-colors duration-300">Delete Employee Account</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">Search employee by ID or email to delete their account with confirmation.</p>
                <div className="mt-4 flex items-center text-[#091e65] text-sm font-medium group-hover:text-[#dc2626] transition-colors duration-300">
                  <span>Search to Delete</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Employee Attendance History */}
              <div 
                className="group bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer transform"
                onClick={() => setShowEmployeeHistory(true)}
              >
                <div className="flex items-center space-x-4 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#091e65] to-[#dc2626] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#091e65] transition-colors duration-300">Employee Attendance History</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">View and manage employee attendance records, time tracking, and reports.</p>
                <div className="mt-4 flex items-center text-[#091e65] text-sm font-medium group-hover:text-[#dc2626] transition-colors duration-300">
                  <span>View Records</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Password Reset Requests */}
              <div 
                className="group bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer transform relative"
                onClick={() => setShowPasswordRequests(true)}
              >
                <div className="flex items-center space-x-4 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#091e65] to-[#dc2626] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#091e65] transition-colors duration-300">Password Reset Requests</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">Handle employee password reset requests and account recovery processes.</p>
                {pendingRequestsCount > 0 && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-semibold rounded-full h-6 min-w-[1.5rem] px-2 flex items-center justify-center">
                    {pendingRequestsCount}
                  </div>
                )}
                <div className="mt-4 flex items-center text-[#091e65] text-sm font-medium group-hover:text-[#dc2626] transition-colors duration-300">
                  <span>Manage Requests</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Employees Table */}
            <EmployeesListTable />
          </div>
        );
      default:
        return null;
    }
  };

  // Show loading screen while verifying authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#091e65] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - desktop */}
      <div className="hidden lg:flex w-64 bg-white shadow-lg flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-center">
            <div className="inline-block">
              <span className="text-2xl font-bold text-[#091e65]">CODE</span>
              <span className="text-2xl font-bold text-[#dc2626]">BORD</span>
            </div>
            <div className="mt-2">
              <span className="inline-block bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
                Admin Panel
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab('admins')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                  activeTab === 'admins'
                    ? 'bg-[#091e65] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Admins</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('employees')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                  activeTab === 'employees'
                    ? 'bg-[#091e65] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Employees</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 relative"
              onClick={handleProfileImageClick}
            >
              {isUploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                  onError={() => {
                    setProfileImage(null);
                  }}
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-[#091e65] to-[#dc2626] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div 
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => setShowPasswordDropdown(!showPasswordDropdown)}
            >
              <p className="text-sm font-medium text-gray-900 truncate">{admin.name}</p>
              <p className="text-xs text-gray-500 truncate">{admin.email}</p>
            </div>
          </div>

          {/* Password Change Dropdown */}
          {showPasswordDropdown && (
            <div 
              ref={dropdownRef}
              className="absolute bottom-20 left-4 w-56 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
            >
              <h3 className="text-sm font-medium text-gray-900 mb-3">Change Password</h3>
              
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent"
                />
                <button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                  className="w-full px-3 py-2 bg-gradient-to-r from-[#091e65] to-[#dc2626] text-white text-sm font-medium rounded-md hover:from-[#dc2626] hover:to-[#091e65] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm font-medium text-[#dc2626] bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden fixed inset-x-0 top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="h-14 flex items-center justify-between px-4">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="Open navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="inline-flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-[#091e65] tracking-tight">CODE</span>
            <span className="text-xl font-extrabold text-[#dc2626] tracking-tight">BORD</span>
          </div>
          <div className="w-6" />
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileNavOpen(false)} />
          <div className="relative w-72 max-w-[80%] h-full bg-white shadow-2xl flex flex-col">
            {/* Drawer content - reuse sidebar sections */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="inline-block">
                  <span className="text-2xl font-bold text-[#091e65]">CODE</span>
                  <span className="text-2xl font-bold text-[#dc2626]">BORD</span>
                </div>
                <button onClick={() => setIsMobileNavOpen(false)} className="p-2 rounded-md hover:bg-gray-100" aria-label="Close navigation">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="mt-2">
                <span className="inline-block bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">Admin Panel</span>
              </div>
              <div className="mt-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#091e65] to-[#dc2626] flex items-center justify-center">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{admin?.name}</div>
                  <div className="text-xs text-gray-500 truncate">{admin?.email}</div>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => { setActiveTab('admins'); setIsMobileNavOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                      activeTab === 'admins' ? 'bg-[#091e65] text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Admins</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setActiveTab('employees'); setIsMobileNavOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                      activeTab === 'employees' ? 'bg-[#091e65] text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span>Employees</span>
                  </button>
                </li>
              </ul>
            </nav>
            {/* Account actions */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <button
                onClick={() => setShowMobileChangePassword((v) => !v)}
                className="w-full px-4 py-2 text-sm font-medium text-[#091e65] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                {showMobileChangePassword ? 'Hide Change Password' : 'Change Password'}
              </button>
              {showMobileChangePassword && (
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent"
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent"
                  />
                  <button
                    onClick={async () => { await handlePasswordChange(); setShowMobileChangePassword(false); }}
                    disabled={isChangingPassword}
                    className="w-full px-3 py-2 bg-gradient-to-r from-[#091e65] to-[#dc2626] text-white text-sm font-medium rounded-md hover:from-[#dc2626] hover:to-[#091e65] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-sm font-medium text-[#dc2626] bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto pt-14 lg:pt-0">
        {/* Global Message Display */}
        {(passwordMessage.text || profileMessage.text) && (
          <div className="sticky top-0 z-40 p-4">
            {passwordMessage.text && (
              <div className={`mb-2 p-3 rounded-lg shadow-md ${
                passwordMessage.type === 'success'
                  ? 'bg-green-100 border border-green-300 text-green-800'
                  : 'bg-red-100 border border-red-300 text-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {passwordMessage.type === 'success' ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="font-medium">{passwordMessage.text}</span>
                  </div>
                  <button
                    onClick={() => setPasswordMessage({ type: '', text: '' })}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {profileMessage.text && (
              <div className={`p-3 rounded-lg shadow-md ${
                profileMessage.type === 'success'
                  ? 'bg-green-100 border border-green-300 text-green-800'
                  : 'bg-red-100 border border-red-300 text-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {profileMessage.type === 'success' ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="font-medium">{profileMessage.text}</span>
                  </div>
                  <button
                    onClick={() => setProfileMessage({ type: '', text: '' })}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <main className="flex-1">
          {renderTabContent()}
        </main>
      </div>

      {/* Profile Image Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Image</h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <label className="cursor-pointer">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#091e65] to-[#dc2626] rounded-full flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-sm text-[#091e65] hover:text-[#dc2626] transition-colors duration-200">
                    Upload New Image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {profileImage && (
                <div className="text-center">
                  <button
                    onClick={handleRemoveImage}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200 text-sm"
                  >
                    Remove Current Image
                  </button>
                </div>
              )}

              {isUploadingImage && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#091e65] mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Uploading image...</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
