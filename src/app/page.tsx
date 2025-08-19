"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ type: '', text: '' });
  const [forgotEmployee, setForgotEmployee] = useState<any | null>(null);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/employees/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });

        // After setting cookie, fetch full profile and store it
        try {
          const meRes = await fetch('/api/employees/me', { credentials: 'include' });
          const meData = await meRes.json();
          if (meRes.ok && meData.employee) {
            localStorage.setItem('employeeData', JSON.stringify(meData.employee));
          }
        } catch {}

        // Clear form
        setFormData({ identifier: '', password: '' });
        
        // Redirect
        setTimeout(() => {
          router.push('/employee-portal');
        }, 500);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotLookup = async () => {
    if (!forgotIdentifier.trim()) {
      setForgotMsg({ type: 'error', text: 'Please enter Employee ID or Email.' });
      return;
    }
    setForgotLoading(true);
    setForgotMsg({ type: '', text: '' });
    setForgotEmployee(null);
    try {
      const url = `/api/employees/lookup?identifier=${encodeURIComponent(forgotIdentifier.trim())}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.employee) {
        setForgotEmployee(data.employee);
        setForgotMsg({ type: 'success', text: 'Employee found. Send reset request to notify admin.' });
      } else {
        setForgotMsg({ type: 'error', text: data.error || 'Employee not found.' });
      }
    } catch (e) {
      setForgotMsg({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotSendRequest = async () => {
    if (!forgotIdentifier.trim()) return;
    setForgotLoading(true);
    setForgotMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/employees/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setForgotMsg({ type: 'success', text: 'Reset request sent to admin.' });
      } else {
        const text = res.status === 409 ? 'A pending request already exists for this employee.' : (data.error || 'Failed to send request.');
        setForgotMsg({ type: 'error', text });
      }
    } catch {
      setForgotMsg({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative h-dvh lg:min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden overflow-x-hidden">
      {/* Ambient Accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-br from-[#091e65] to-[#dc2626] opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-tr from-indigo-400 to-pink-400 opacity-20 blur-3xl" />

      {/* Vertical soft divider for large screens */}
      <div className="hidden lg:block absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#091e65]/10 to-transparent" />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 h-dvh lg:min-h-screen items-stretch gap-y-4 lg:gap-y-0 overflow-hidden">
        {/* Left - Brand & Messaging (full height, no card) */}
        <section className="row-start-1 lg:row-start-auto flex items-center lg:justify-end px-8 lg:px-16 py-6 lg:py-16 h-full">
          <div className="max-w-2xl">
            <div className="mb-8">
              <div className="inline-block">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#091e65] tracking-tight">CODE</span>
                <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#dc2626] tracking-tight">BORD</span>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center gap-2 bg-white/80 text-gray-900 px-4 py-2 rounded-2xl text-xs font-semibold border border-white/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#091e65]" /> Employee Portal
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Premium access to your workday
            </h1>
            <p className="mt-3 sm:mt-4 text-gray-600 text-base sm:text-lg">
              Sign in to view your profile, documents, and mark attendance with live camera capture.
            </p>

            {/* Inline feature chips (no cards) */}
            <div className="hidden md:flex mt-6 lg:mt-8 flex-wrap gap-3">
              <span className="px-3 py-1.5 rounded-full bg-white/70 backdrop-blur text-sm text-gray-800 border border-white/60">🔒 Secure by design</span>
              <span className="px-3 py-1.5 rounded-full bg-white/70 backdrop-blur text-sm text-gray-800 border border-white/60">🕐 Smart attendance</span>
              <span className="px-3 py-1.5 rounded-full bg-white/70 backdrop-blur text-sm text-gray-800 border border-white/60">📄 Documents on hand</span>
              <span className="px-3 py-1.5 rounded-full bg-white/70 backdrop-blur text-sm text-gray-800 border border-white/60">⚡ Lightning fast</span>
            </div>
          </div>
        </section>

        {/* Right - Full-height login panel (no box) */}
        <section className="row-start-2 lg:row-start-auto relative bg-white lg:bg-white/55 lg:supports-[backdrop-filter]:backdrop-blur-xl lg:pl-16 px-8 py-6 lg:py-16 flex items-center h-full">
          <div className="w-full max-w-md lg:max-w-xl mx-auto">
            {/* Message Banner */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your employee account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Employee ID/Email Field */}
              <div>
                <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee ID or Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    value={formData.identifier}
                    onChange={handleInputChange}
                    autoComplete="username email"
                    className="block w-full pl-12 pr-4 py-3.5 sm:py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-300 bg-white/70 hover:bg-white"
                    placeholder="Enter Employee ID or Email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    autoComplete="current-password"
                    className="block w-full pl-12 pr-4 py-3.5 sm:py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#091e65] focus:border-transparent transition-all duration-300 bg-white/70 hover:bg-white"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-sm font-semibold text-[#091e65] hover:text-[#dc2626] transition-colors duration-200">
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-6 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[#091e65] to-[#1e40af] hover:from-[#1e40af] hover:to-[#091e65] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#091e65] transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </section>
      </div>
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
              <button onClick={() => { setShowForgotModal(false); setForgotEmployee(null); setForgotIdentifier(''); setForgotMsg({ type: '', text: '' }); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                placeholder="Enter Employee ID or Email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#091e65]"
              />
              <div className="flex items-center justify-end">
                <button onClick={handleForgotLookup} disabled={forgotLoading} className="px-4 py-2 bg-[#091e65] text-white rounded-md hover:bg-[#1e40af] disabled:opacity-50">
                  {forgotLoading ? 'Looking up...' : 'Lookup'}
                </button>
              </div>
              {forgotMsg.text && (
                <div className={`p-2 rounded ${forgotMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {forgotMsg.text}
                </div>
              )}
              {forgotEmployee && (
                <div className="mt-2 p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#091e65] to-[#dc2626] flex items-center justify-center text-white font-bold">
                      {forgotEmployee.name.split(' ').map((p: string) => p[0]).slice(0,2).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{forgotEmployee.name}</div>
                      <div className="text-sm text-gray-600">{forgotEmployee.designation} • {forgotEmployee.department}</div>
                      <div className="text-sm text-gray-500">{forgotEmployee.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-right">
                    <button onClick={handleForgotSendRequest} disabled={forgotLoading} className="px-4 py-2 bg-[#091e65] text-white rounded-md hover:bg-[#1e40af] disabled:opacity-50">
                      {forgotLoading ? 'Sending...' : 'Send reset request'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
