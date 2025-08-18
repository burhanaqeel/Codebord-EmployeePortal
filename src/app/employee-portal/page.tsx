"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  profileImage?: string;
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

interface Attendance {
  _id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  clockInImage: string;
  clockOutImage?: string;
  totalHours?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeePortal() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employee-data');
  const [employeeSubTab, setEmployeeSubTab] = useState('employee-data');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Attendance System States
  const [attendanceSubTab, setAttendanceSubTab] = useState('mark-attendance');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isProcessingAttendance, setIsProcessingAttendance] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState({ type: '', text: '' });
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageTitle, setSelectedImageTitle] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        // Prefer server session to get fresh, complete profile
        const meRes = await fetch('/api/employees/me', { credentials: 'include' });
        if (meRes.ok) {
          const me = await meRes.json();
          const parsedEmployee = me.employee;
          localStorage.setItem('employeeData', JSON.stringify(parsedEmployee));
          const cleanedEmployee = {
            ...parsedEmployee,
            dob: parsedEmployee.dob || null,
            dateOfJoining: parsedEmployee.dateOfJoining || null,
            createdAt: parsedEmployee.createdAt || null,
            updatedAt: parsedEmployee.updatedAt || null,
            salary: parsedEmployee.salary || 0,
            permanentAddress: parsedEmployee.permanentAddress || '',
            roles: Array.isArray(parsedEmployee.roles) ? parsedEmployee.roles : [],
            idCardFront: parsedEmployee.idCardFront || '',
            idCardBack: parsedEmployee.idCardBack || '',
            offerLetter: parsedEmployee.offerLetter || '',
            profileImage: parsedEmployee.profileImage || ''
          };
          setEmployee(cleanedEmployee);
          // Prefer server-stored profile image if available
          if (parsedEmployee.profileImage) {
            const fn = String(parsedEmployee.profileImage).split('/').pop();
            if (fn) setProfileImage(`/api/employees/profile-image/${encodeURIComponent(fn)}`);
          } else {
            const savedImage = localStorage.getItem(`employeeProfileImage_${cleanedEmployee.employeeId}`);
            if (savedImage && savedImage.trim() !== '') setProfileImage(savedImage);
          }
          setLoading(false);
          return;
        }
        // Fallback to localStorage if session is missing
        const employeeData = localStorage.getItem('employeeData');
        if (!employeeData) {
          router.push('/');
          return;
        }
        const parsedEmployee = JSON.parse(employeeData);
        setEmployee(parsedEmployee);
        setLoading(false);
      } catch (e) {
        router.push('/');
      }
    };
    load();
  }, [router]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check today's attendance when attendance tab is active
  useEffect(() => {
    if (activeTab === 'attendance-system' && employee) {
      checkTodayAttendance();
      if (attendanceSubTab === 'attendance-history') {
        fetchAttendanceHistory();
      }
    }
  }, [activeTab, attendanceSubTab, employee]);

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        stopCamera();
      }
    };
  }, [cameraStream]);



  // Update video element when camera stream changes
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      
      // Ensure video plays
      const playVideo = async () => {
        try {
          if (videoRef.current && videoRef.current.paused) {
            await videoRef.current.play();
          }
        } catch (error) {
          console.error('Error playing video:', error);
        }
      };
      
      playVideo();
    }
  }, [cameraStream]);

  const handleLogout = () => {
    localStorage.removeItem('employeeData');
    router.push('/');
  };

  const handleDocumentView = (filePath: string) => {
    const filename = filePath.split('/').pop();
    if (filename) {
      const url = `/api/employees/documents/${encodeURIComponent(filename)}`;
      window.open(url, '_blank');
    }
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
        const res = await fetch('/api/employees/profile-image', {
          method: 'POST',
          body: form,
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok) {
          const url: string = data.url || (data.profileImage ? `/api/employees/profile-image/${encodeURIComponent(String(data.profileImage).split('/').pop() || '')}` : '');
          setProfileImage(url);
          // refresh local stored employee for future loads
          const stored = localStorage.getItem('employeeData');
          if (stored) {
            try {
              const e = JSON.parse(stored);
              e.profileImage = data.profileImage;
              localStorage.setItem('employeeData', JSON.stringify(e));
            } catch {}
          }
          setProfileMessage({ type: 'success', text: 'Profile image saved.' });
          setShowProfileModal(false);
          setTimeout(() => setProfileMessage({ type: '', text: '' }), 2000);
        } else {
          setProfileMessage({ type: 'error', text: data.error || 'Upload failed.' });
        }
      } catch (e: any) {
        setProfileMessage({ type: 'error', text: e?.message || 'Upload failed. Please try again.' });
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    localStorage.removeItem(`employeeProfileImage_${employee?.employeeId}`);
    setProfileMessage({ type: 'success', text: 'Profile image removed successfully!' });
        setShowProfileModal(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setProfileMessage({ type: '', text: '' });
        }, 3000);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/employees/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employee?.employeeId,
          email: employee?.email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully! Please login again with your new password.' });
        
        // Clear form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Close modal after 2 seconds and redirect to login
        setTimeout(() => {
          setShowPasswordModal(false);
          handleLogout();
        }, 2000);
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') {
      return 'Not provided';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Not provided';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Not provided';
    }
  };

  const formatSalary = (salary: number) => {
    if (!salary || isNaN(salary) || salary <= 0) {
      return 'Not provided';
    }
    
    try {
      return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR'
      }).format(salary);
    } catch (error) {
      return 'Not provided';
    }
  };

  // Attendance System Functions
  const checkTodayAttendance = async () => {
    if (!employee) return;
    
    try {
      const response = await fetch(`/api/attendance/today?employeeId=${employee.employeeId}`, { credentials: 'include' });
      const data = await response.json();
      
      if (response.ok) {
        setTodayAttendance(data);
      }
    } catch (error) {
      console.error('Error checking today\'s attendance:', error);
    }
  };

  const fetchAttendanceHistory = async () => {
    if (!employee) return;
    
    try {
      const response = await fetch(`/api/attendance/history?employeeId=${employee.employeeId}`, { credentials: 'include' });
      const data = await response.json();
      
      if (response.ok) {
        setAttendanceHistory(data.attendanceHistory);
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const startCamera = async () => {
    try {
      setIsStartingCamera(true);
      setAttendanceMessage({ type: '', text: '' });
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setAttendanceMessage({ 
          type: 'error', 
          text: 'Camera is not supported in this browser.' 
        });
        return;
      }

             // Check available devices
       const devices = await navigator.mediaDevices.enumerateDevices();
       const videoDevices = devices.filter(device => device.kind === 'videoinput');

       if (videoDevices.length === 0) {
         setAttendanceMessage({ 
           type: 'error', 
           text: 'No camera devices found on this system.' 
         });
         return;
       }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      setCameraStream(stream);
      setIsCameraActive(true);
      
                           // Ensure video element is properly set up
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      
      
    } catch (error: any) {
      console.error('Error starting camera:', error);
      let errorMessage = 'Unable to access camera.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not met. Please try again.';
      }
      
      setAttendanceMessage({ 
        type: 'error', 
        text: errorMessage 
      });
    } finally {
      setIsStartingCamera(false);
    }
  };



  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
      });
      setCameraStream(null);
      setIsCameraActive(false);
      
      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('Could not get canvas context');
      return;
    }
    
    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video not ready yet');
      setAttendanceMessage({ 
        type: 'error', 
        text: 'Camera not ready. Please wait a moment and try again.' 
      });
      return;
    }
    
    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);
      
             // Stop camera after capturing
       stopCamera();
    } catch (error) {
      console.error('Error capturing image:', error);
      setAttendanceMessage({ 
        type: 'error', 
        text: 'Failed to capture image. Please try again.' 
      });
    }
  };

  const handleClockIn = async () => {
    if (!employee || !capturedImage) return;
    
    setIsProcessingAttendance(true);
    setAttendanceMessage({ type: '', text: '' });
    
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('employeeId', employee.employeeId);
      formData.append('employeeName', employee.name);
      formData.append('clockInImage', blob, 'clock-in.jpg');
      
      const clockInResponse = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const data = await clockInResponse.json();
      
      if (clockInResponse.ok) {
        setAttendanceMessage({ 
          type: 'success', 
          text: 'Clock in successful! Welcome to work.' 
        });
        setShowClockInModal(false);
        setCapturedImage(null);
        
        // Refresh today's attendance
        setTimeout(() => {
          checkTodayAttendance();
        }, 1000);
      } else {
        setAttendanceMessage({ 
          type: 'error', 
          text: data.error || 'Clock in failed. Please try again.' 
        });
      }
    } catch (error) {
      setAttendanceMessage({ 
        type: 'error', 
        text: 'An error occurred. Please try again.' 
      });
    } finally {
      setIsProcessingAttendance(false);
    }
  };

  const handleClockOut = async () => {
    if (!employee || !capturedImage) return;
    
    setIsProcessingAttendance(true);
    setAttendanceMessage({ type: '', text: '' });
    
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('employeeId', employee.employeeId);
      formData.append('clockOutImage', blob, 'clock-out.jpg');
      
      const clockOutResponse = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const data = await clockOutResponse.json();
      
      if (clockOutResponse.ok) {
        setAttendanceMessage({ 
          type: 'success', 
          text: 'Clock out successful! Have a great day.' 
        });
        setShowClockOutModal(false);
        setCapturedImage(null);
        
        // Refresh today's attendance and history
        setTimeout(() => {
          checkTodayAttendance();
          fetchAttendanceHistory();
        }, 1000);
      } else {
        setAttendanceMessage({ 
          type: 'error', 
          text: data.error || 'Clock out failed. Please try again.' 
        });
      }
    } catch (error) {
      setAttendanceMessage({ 
        type: 'error', 
        text: 'An error occurred. Please try again.' 
      });
    } finally {
      setIsProcessingAttendance(false);
    }
  };

  const formatAttendanceTime = (timeString: string) => {
    if (!timeString) return 'Not available';
    
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-PK', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const formatAttendanceDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PK', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleImageClick = (imagePath: string, title: string) => {
    // Convert the image path to a proper URL for the API
    const filename = imagePath.split('/').pop(); // Get filename from path
    if (filename) {
      setSelectedImage(`/api/attendance/images/${filename}`);
      setSelectedImageTitle(title);
      setShowImageModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#091e65] border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Professional Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left Side - Logo */}
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold tracking-tight">
                  <span className="text-[#091e65]">CODE</span>
                  <span className="text-[#dc2626]">BORD</span>
                </div>
                <div className="text-xs font-medium text-gray-500 mt-1 tracking-wider uppercase">Employee Portal</div>
              </div>
            </div>

            {/* Center - Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <button 
                onClick={() => {
                  setActiveTab('employee-data');
                  setEmployeeSubTab('employee-data');
                }}
                className={`px-5 py-2 font-medium rounded-lg transition-all duration-200 ${
                  activeTab === 'employee-data' || activeTab === 'documents-data'
                    ? 'bg-[#091e65] text-white'
                    : 'text-[#091e65] hover:bg-[#091e65] hover:text-white'
                }`}
              >
                Employee Details
              </button>
              <button 
                onClick={() => setActiveTab('attendance-system')}
                className={`px-5 py-2 font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'attendance-system'
                    ? 'bg-[#091e65] text-white'
                    : 'text-[#091e65] hover:bg-[#091e65] hover:text-white'
                }`}
              >
                <span>📹</span>
                <span>Attendance System</span>
                {activeTab === 'attendance-system' && isCameraActive && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </button>
            </div>

            {/* Right Side - Profile */}
            <div className="flex items-center space-x-4">
              {/* Employee Info */}
              <div className="hidden md:block text-right mr-3">
                <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                <div className="text-xs text-gray-500">{employee.email}</div>
              </div>
              
              {/* Profile Avatar */}
              <div className="relative group">
                <div 
                  className="w-10 h-10 bg-gradient-to-br from-[#091e65] to-[#dc2626] rounded-xl flex items-center justify-center shadow-md cursor-pointer transform hover:scale-105 transition-all duration-200 overflow-hidden"
                  onClick={handleProfileImageClick}
                >
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                
                {/* Profile Dropdown */}
                <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                  <div className="p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div 
                        className="w-10 h-10 bg-gradient-to-br from-[#091e65] to-[#dc2626] rounded-xl flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={handleProfileImageClick}
                      >
                        {profileImage ? (
                          <img 
                            src={profileImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                        <div className="text-xs text-[#091e65] font-medium">{employee.designation}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-[#091e65] font-medium rounded-lg hover:bg-[#091e65] hover:text-white transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span>Change Password</span>
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'employee-data' && (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                Employee Details
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                View your complete employee information and manage your profile
              </p>
              {/* Debug buttons removed - data fetching is now automatic and consistent */}
            </div>

            {/* Employee Data Tabs */}
            {/* Full-width, cardless tab navigation */}
            <div className="border-b border-[#091e65]/10">
              <div className="flex gap-2">
                <button
                  onClick={() => setEmployeeSubTab('employee-data')}
                  className={`px-4 py-3 font-medium transition-colors duration-200 relative ${
                    employeeSubTab === 'employee-data'
                      ? 'text-[#091e65]'
                      : 'text-gray-600 hover:text-[#091e65]'
                  }`}
                >
                  <span className="relative z-10">Employee Data</span>
                  {employeeSubTab === 'employee-data' && (
                    <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-gradient-to-r from-[#091e65] via-[#1e40af] to-[#dc2626]" />
                  )}
                </button>
                <button
                  onClick={() => setEmployeeSubTab('documents-data')}
                  className={`px-4 py-3 font-medium transition-colors duration-200 relative ${
                    employeeSubTab === 'documents-data'
                      ? 'text-[#091e65]'
                      : 'text-gray-600 hover:text-[#091e65]'
                  }`}
                >
                  <span className="relative z-10">Documents Data</span>
                  {employeeSubTab === 'documents-data' && (
                    <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-gradient-to-r from-[#091e65] via-[#1e40af] to-[#dc2626]" />
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="pt-8">
                {employeeSubTab === 'employee-data' && (
                  <div className="space-y-8">
                    {/* Profile Section */}
                    <div className="flex items-center space-x-6">
                      <div 
                        className="w-24 h-24 bg-gradient-to-br from-[#091e65] to-[#dc2626] rounded-2xl flex items-center justify-center shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-200"
                        onClick={handleProfileImageClick}
                      >
                        {profileImage ? (
                          <img 
                            src={profileImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{employee.name}</h2>
                        <p className="text-lg text-[#091e65] font-medium">{employee.designation}</p>
                        <p className="text-gray-600">{employee.department}</p>
                        <button
                          onClick={handleProfileImageClick}
                          className="mt-3 px-4 py-2 text-sm font-medium text-[#091e65] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                        >
                          {profileImage ? 'Change Photo' : 'Add Photo'}
                        </button>
                      </div>
                    </div>

                    {/* Information (full-width, cardless) */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">Information</h3>
                      <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
                        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-gray-600">Employee ID</div>
                              <div className="text-gray-900 font-medium">{employee.employeeId}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Full Name</div>
                              <div className="text-gray-900 font-medium">{employee.name}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Email Address</div>
                              <div className="text-gray-900 font-medium">{employee.email}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Date of Birth</div>
                              <div className="text-gray-900 font-medium">{formatDate(employee.dob)}</div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-gray-600">Designation</div>
                              <div className="text-gray-900 font-medium">{employee.designation}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Department</div>
                              <div className="text-gray-900 font-medium">{employee.department}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Date of Joining</div>
                              <div className="text-gray-900 font-medium">{formatDate(employee.dateOfJoining)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Monthly Salary</div>
                              <div className="text-gray-900 font-medium">{formatSalary(employee.salary)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Status</div>
                              <div>
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
                        </div>
                      </div>
                    </div>

                    {/* Additional Information (full-width) */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                      <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
                        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Roles */}
                          <div>
                            <div className="text-sm text-gray-600 mb-2">Employee Roles</div>
                            <div className="flex flex-wrap gap-2">
                              {employee.roles && employee.roles.length > 0 ? (
                                employee.roles.map((role, index) => (
                                  <span key={index} className="px-3 py-1 bg-[#091e65] text-white text-sm rounded-full">
                                    {role}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-500 text-sm">No roles assigned</span>
                              )}
                            </div>
                          </div>

                          {/* Address */}
                          <div>
                            <div className="text-sm text-gray-600 mb-2">Permanent Address</div>
                            <div className="text-gray-900">
                              {employee.permanentAddress && employee.permanentAddress.trim() !== '' 
                                ? employee.permanentAddress 
                                : 'Not provided'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Account Information (full-width) */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                      <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
                        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <div className="text-sm text-gray-600">Account Created</div>
                            <div className="text-gray-900 font-medium">{formatDate(employee.createdAt)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Last Updated</div>
                            <div className="text-gray-900 font-medium">{formatDate(employee.updatedAt)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {employeeSubTab === 'documents-data' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents</h2>
                      <p className="text-gray-600">Access your uploaded documents</p>
                    </div>

                    <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
                      {/* ID Card Front Row */}
                      <div className="py-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#091e65] to-[#dc2626] flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Document</div>
                            <div className="text-lg font-semibold text-gray-900">ID Card Front</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {employee.idCardFront && employee.idCardFront.trim() !== '' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Uploaded</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Not Uploaded</span>
                          )}
                          {employee.idCardFront && employee.idCardFront.trim() !== '' && (
                            <button
                              onClick={() => handleDocumentView(employee.idCardFront as string)}
                              className="text-[#091e65] hover:text-[#1e40af] font-medium underline underline-offset-4"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ID Card Back Row */}
                      <div className="py-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#091e65] to-[#dc2626] flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Document</div>
                            <div className="text-lg font-semibold text-gray-900">ID Card Back</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {employee.idCardBack && employee.idCardBack.trim() !== '' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Uploaded</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Not Uploaded</span>
                          )}
                          {employee.idCardBack && employee.idCardBack.trim() !== '' && (
                            <button
                              onClick={() => handleDocumentView(employee.idCardBack as string)}
                              className="text-[#091e65] hover:text-[#1e40af] font-medium underline underline-offset-4"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Offer Letter Row */}
                      <div className="py-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#091e65] to-[#dc2626] flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Document</div>
                            <div className="text-lg font-semibold text-gray-900">Offer Letter</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {employee.offerLetter && employee.offerLetter.trim() !== '' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Uploaded</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Not Uploaded</span>
                          )}
                          {employee.offerLetter && employee.offerLetter.trim() !== '' && (
                            <button
                              onClick={() => handleDocumentView(employee.offerLetter as string)}
                              className="text-[#091e65] hover:text-[#1e40af] font-medium underline underline-offset-4"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'attendance-system' && (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                Attendance System
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Mark your daily attendance with live camera capture
              </p>
            </div>

            {/* Current Time (full-width, cardless) */}
            <div className="text-center py-6 border-y border-gray-200">
              <div className="text-4xl font-bold text-[#091e65] tracking-tight">
                {currentTime.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </div>
              <div className="text-lg text-gray-600">
                {currentTime.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-sm text-gray-500 mt-1">Karachi, Pakistan Time</div>
            </div>

            {/* Attendance Tabs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Tab Navigation (converted to full-width underline style) */}
              <div className="border-b border-[#091e65]/10">
                <div className="flex gap-2">
                  <button
                    onClick={() => setAttendanceSubTab('mark-attendance')}
                    className={`px-4 py-3 font-medium transition-colors duration-200 relative ${
                      attendanceSubTab === 'mark-attendance' ? 'text-[#091e65]' : 'text-gray-600 hover:text-[#091e65]'
                    }`}
                  >
                    <span className="relative z-10">Mark Attendance</span>
                    {attendanceSubTab === 'mark-attendance' && (
                      <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-gradient-to-r from-[#091e65] via-[#1e40af] to-[#dc2626]" />
                    )}
                  </button>
                  <button
                    onClick={() => setAttendanceSubTab('attendance-history')}
                    className={`px-4 py-3 font-medium transition-colors duration-200 relative ${
                      attendanceSubTab === 'attendance-history' ? 'text-[#091e65]' : 'text-gray-600 hover:text-[#091e65]'
                    }`}
                  >
                    <span className="relative z-10">Attendance History</span>
                    {attendanceSubTab === 'attendance-history' && (
                      <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-gradient-to-r from-[#091e65] via-[#1e40af] to-[#dc2626]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-8">
                {attendanceSubTab === 'mark-attendance' && (
                  <div className="space-y-8">
                    {/* Today's Status (full-width, cardless) */}
                    {todayAttendance && (
                      <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
                        <div className="py-3 text-sm text-gray-600">Today's Status</div>
                        <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-[#091e65]">
                              {todayAttendance.hasClockedIn ? '✓' : '○'}
                            </div>
                            <div className="text-sm text-gray-700">Clock In</div>
                            {todayAttendance.hasClockedIn && (
                              <div className="text-xs text-gray-500 mt-1">
                                {formatAttendanceTime(todayAttendance.attendance?.clockInTime)}
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-[#091e65]">
                              {todayAttendance.hasClockedOut ? '✓' : '○'}
                            </div>
                            <div className="text-sm text-gray-700">Clock Out</div>
                            {todayAttendance.hasClockedOut && (
                              <div className="text-xs text-gray-500 mt-1">
                                {formatAttendanceTime(todayAttendance.attendance?.clockOutTime)}
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-[#091e65]">
                              {todayAttendance.attendance?.totalHours || '0'}
                            </div>
                            <div className="text-sm text-gray-700">Total Hours</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Camera Section */}
                    <div className="space-y-6">
                                             <div className="flex items-center justify-between">
                         <h3 className="text-xl font-semibold text-gray-900">Live Camera</h3>
                         <div className="flex items-center space-x-4">
                           <div className="flex items-center space-x-2">
                             <div className={`w-3 h-3 rounded-full ${
                               isCameraActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                             }`}></div>
                             <span className="text-sm text-gray-600">
                               {isCameraActive ? 'Camera Active' : 'Camera Inactive'}
                             </span>
                           </div>
                           
                           
                         </div>
                       </div>
                      
                      {!isCameraActive && !capturedImage && (
                        <div className="text-center space-y-4">
                          <button
                            onClick={startCamera}
                            disabled={isStartingCamera}
                            className="px-8 py-4 bg-[#091e65] text-white rounded-xl hover:bg-[#1e40af] transition-colors duration-200 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            {isStartingCamera ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                <span>Starting Camera...</span>
                              </>
                            ) : (
                              <>
                                <span>📹</span>
                                <span>Start Camera</span>
                              </>
                            )}
                          </button>
                          
                          
                        </div>
                      )}

                      {isCameraActive && (
                        <div className="space-y-4">
                          <div className="relative mx-auto max-w-md">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              controls={false}
                              className="w-full h-64 border-2 border-gray-200 bg-gray-100 rounded"
                              style={{ minHeight: '256px' }}
                            />
                            {/* Fallback message if video not showing - only show when video is not ready */}
                            {cameraStream && (!videoRef.current || videoRef.current.readyState < 2) && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                                <div className="text-center text-gray-600">
                                  <div className="text-4xl mb-2">📹</div>
                                  <div className="text-sm font-medium">Camera Active</div>
                                  <div className="text-xs">Video loading... Please wait</div>
                                </div>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 z-10">
                              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span>LIVE</span>
                              </div>
                            </div>
                            <div className="absolute bottom-2 left-2 z-10">
                              <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
                                Camera Active
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-center space-x-4">
                            <button
                              onClick={captureImage}
                              className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 font-medium flex items-center space-x-2"
                            >
                              <span>📸</span>
                              <span>Capture Image</span>
                            </button>
                            <button
                              onClick={stopCamera}
                              className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 font-medium flex items-center space-x-2"
                            >
                              <span>⏹️</span>
                              <span>Stop Camera</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {capturedImage && (
                        <div className="space-y-4">
                          <div className="text-center">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Captured Image</h4>
                            <img
                              src={capturedImage}
                              alt="Captured"
                              className="mx-auto max-w-md rounded-xl border-2 border-gray-200"
                            />
                          </div>
                          
                          <div className="flex justify-center space-x-4">
                            {!todayAttendance?.hasClockedIn && (
                              <button
                                onClick={() => setShowClockInModal(true)}
                                className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 font-medium"
                              >
                                🕐 Clock In
                              </button>
                            )}
                            
                            {todayAttendance?.hasClockedIn && !todayAttendance?.hasClockedOut && (
                              <button
                                onClick={() => setShowClockOutModal(true)}
                                className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 font-medium"
                              >
                                🕐 Clock Out
                              </button>
                            )}
                            
                            <button
                              onClick={() => {
                                setCapturedImage(null);
                                setAttendanceMessage({ type: '', text: '' });
                              }}
                              className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200 font-medium"
                            >
                              Retake Photo
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Message Display */}
                      {attendanceMessage.text && (
                        <div className={`p-4 rounded-lg text-center ${
                          attendanceMessage.type === 'success'
                            ? 'bg-green-100 border border-green-300 text-green-800'
                            : 'bg-red-100 border border-red-300 text-red-800'
                        }`}>
                          <div className="flex items-center justify-center space-x-2">
                            {attendanceMessage.type === 'success' ? (
                              <span>✅</span>
                            ) : (
                              <span>❌</span>
                            )}
                            <span>{attendanceMessage.text}</span>
                          </div>
                          
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {attendanceSubTab === 'attendance-history' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900">Attendance History (Last 30 Days)</h3>
                    
                    {attendanceHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">📅</div>
                        <p className="text-gray-600">No attendance records found</p>
                      </div>
                    ) : (
                      <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
                        {attendanceHistory.map((record) => (
                          <div key={record._id} className="py-5">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {formatAttendanceDate(record.date)}
                                </h4>
                                <p className="text-sm text-gray-600">Employee: {record.employeeName}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                record.status === 'present' 
                                  ? 'bg-green-100 text-green-800' 
                                  : record.status === 'late'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-600">Clock In</label>
                                <p className="text-gray-900 font-medium">
                                  {formatAttendanceTime(record.clockInTime)}
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600">Clock Out</label>
                                <p className="text-gray-900 font-medium">
                                  {record.clockOutTime ? formatAttendanceTime(record.clockOutTime) : 'Not clocked out'}
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600">Total Hours</label>
                                <p className="text-gray-900 font-medium">
                                  {record.totalHours ? `${record.totalHours} hrs` : 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                 <label className="block text-sm font-medium text-gray-600 mb-2">Clock In Image</label>
                                 <div 
                                   className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                                   onClick={() => handleImageClick(record.clockInImage, `Clock In - ${formatAttendanceDate(record.date)}`)}
                                 >
                                   {record.clockInImage ? (
                                     <div className="text-center">
                                       <div className="text-2xl mb-2">📸</div>
                                       <div className="text-sm text-gray-600">Click to view</div>
                                     </div>
                                   ) : (
                                     <div className="text-center text-gray-500">
                                       <div className="text-2xl mb-2">❌</div>
                                       <div className="text-sm">No image</div>
                                     </div>
                                   )}
                                 </div>
                               </div>
                               <div>
                                 <label className="block text-sm font-medium text-gray-600 mb-2">Clock Out Image</label>
                                 <div 
                                   className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                                   onClick={() => record.clockOutImage ? handleImageClick(record.clockOutImage, `Clock Out - ${formatAttendanceDate(record.date)}`) : null}
                                 >
                                   {record.clockOutImage ? (
                                     <div className="text-center">
                                       <div className="text-2xl mb-2">📸</div>
                                       <div className="text-sm text-gray-600">Click to view</div>
                                     </div>
                                   ) : (
                                     <div className="text-center text-gray-500">
                                       <div className="text-2xl mb-2">⏹️</div>
                                       <div className="text-sm">Not clocked out</div>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Profile Image Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Profile Image</h3>
                <p className="text-xs text-gray-500 mt-1">PNG or JPG, up to 5MB</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {profileMessage.text && (
                <div className={`p-3 rounded-lg text-sm ${
                  profileMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {profileMessage.text}
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-100 shrink-0">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#091e65] to-[#dc2626] flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <div className="border-2 border-dashed border-gray-200 hover:border-[#091e65] rounded-xl p-4 text-center cursor-pointer transition-colors">
                      <div className="text-sm font-medium text-[#091e65]">{profileImage ? 'Change Image' : 'Upload New Image'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Click to select a file</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {profileImage && (
                  <button
                    onClick={handleRemoveImage}
                    className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                )}
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>

              {isUploadingImage && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#091e65] border-t-transparent mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Uploading image...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Message Display */}
              {passwordMessage.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-100 border border-green-300 text-green-800'
                    : 'bg-red-100 border border-red-300 text-red-800'
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent"
                    placeholder="Enter current password"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent"
                    placeholder="Enter new password"
                  />
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 px-4 py-2 bg-[#091e65] text-white rounded-lg hover:bg-[#1e40af] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                                 </div>
               </form>
             </div>
           </div>
         </div>
       )}

       {/* Clock In Modal */}
       {showClockInModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
             <div className="p-6">
               <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">Clock In Confirmation</h3>
                 <p className="text-gray-600 mt-2">Confirm your clock in with the captured image</p>
               </div>

               {capturedImage && (
                 <div className="mb-6">
                   <img
                     src={capturedImage}
                     alt="Captured"
                     className="w-full h-48 object-cover rounded-lg border border-gray-200"
                   />
                 </div>
               )}

               <div className="space-y-4">
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <div className="text-center">
                     <div className="text-2xl font-bold text-blue-600 mb-2">
                       {currentTime.toLocaleTimeString('en-PK', {
                         hour: '2-digit',
                         minute: '2-digit',
                         second: '2-digit',
                         hour12: true
                       })}
                     </div>
                     <div className="text-sm text-blue-700">
                       {currentTime.toLocaleDateString('en-PK', {
                         weekday: 'long',
                         year: 'numeric',
                         month: 'long',
                         day: 'numeric'
                       })}
                     </div>
                   </div>
                 </div>

                 <div className="flex space-x-3">
                   <button
                     onClick={() => setShowClockInModal(false)}
                     className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleClockIn}
                     disabled={isProcessingAttendance}
                     className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                   >
                     {isProcessingAttendance ? 'Processing...' : '🕐 Clock In'}
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Clock Out Modal */}
       {showClockOutModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
             <div className="p-6">
               <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">Clock Out Confirmation</h3>
                 <p className="text-gray-600 mt-2">Confirm your clock out with the captured image</p>
               </div>

               {capturedImage && (
                 <div className="mb-6">
                   <img
                     src={capturedImage}
                     alt="Captured"
                     className="w-full h-48 object-cover rounded-lg border border-gray-200"
                   />
                 </div>
               )}

               <div className="space-y-4">
                 <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                   <div className="text-center">
                     <div className="text-2xl font-bold text-red-600 mb-2">
                       {currentTime.toLocaleTimeString('en-PK', {
                         hour: '2-digit',
                         minute: '2-digit',
                         second: '2-digit',
                         hour12: true
                       })}
                     </div>
                     <div className="text-sm text-red-700">
                       {currentTime.toLocaleDateString('en-PK', {
                         weekday: 'long',
                         year: 'numeric',
                         month: 'long',
                         day: 'numeric'
                       })}
                     </div>
                   </div>
                 </div>

                 <div className="flex space-x-3">
                   <button
                     onClick={() => setShowClockOutModal(false)}
                     className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleClockOut}
                     disabled={isProcessingAttendance}
                     className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                   >
                     {isProcessingAttendance ? 'Processing...' : '🕐 Clock Out'}
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

               {/* Image View Modal */}
        {showImageModal && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{selectedImageTitle}</h3>
                  <button
                    onClick={() => {
                      setShowImageModal(false);
                      setSelectedImage(null);
                      setSelectedImageTitle('');
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt={selectedImageTitle}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error('Error loading image:', e);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="text-center text-gray-500">
                          <div class="text-4xl mb-4">❌</div>
                          <div class="text-lg font-medium">Image not found</div>
                          <div class="text-sm">The attendance image could not be loaded</div>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Hidden Canvas for Image Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      );
    }
     

