import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { LogIn, Lock, Mail, Loader2, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [role, setRole] = useState('CUSTOMER'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [showForgot, setShowForgot] = useState(false);
  const [resetData, setResetData] = useState({ email: '', newPassword: '' });
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await authApi.resetPassword(resetData);
      setShowForgot(false);
      setFormData({ ...formData, email: resetData.email });
      alert('Password reset successful! You can now log in.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const loginFn = role === 'ADMIN' ? authApi.login : authApi.customerLogin;
      const response = await loginFn(formData);

      const authData = response.data?.data || response.data;
      const token = authData.token;

      if (!token) throw new Error('No token received from server');

      localStorage.setItem(role === 'ADMIN' ? 'admin_token' : 'customer_token', token);
      localStorage.setItem('user', JSON.stringify({
        id: authData.id,
        name: authData.name || authData.firstName,
        email: authData.email,
        role: authData.role || role,
        image: authData.image
      }));
      localStorage.setItem('role', role);

      if (role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-100"
          >
            <h2 className="text-xl font-black text-slate-900 mb-2">Reset Password</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">Enter your account email and choose a new password.</p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="email"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-slate-900"
                    placeholder="name@email.com"
                    onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-slate-900"
                    placeholder="••••••••"
                    onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center"
                >
                  {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden border border-slate-100 relative z-10"
      >
        {/* Header */}
        <div className="bg-[#050B14] p-8 text-white text-center relative">
          <Link
            to="/home"
            className="absolute left-6 top-7 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <span className="text-white font-black text-2xl tracking-tighter">A</span>
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Welcome Back</h1>
          <p className="text-slate-400 text-xs font-medium mt-1">Sign in to your Accesora account</p>

          {/* Role Switcher */}
          <div className="mt-6 flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setRole('CUSTOMER')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                role === 'CUSTOMER' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Customer Account
            </button>
            <button
              onClick={() => setRole('ADMIN')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                role === 'ADMIN' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold rounded-xl flex items-center">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  placeholder={role === 'ADMIN' ? 'admin@mail.com' : 'customer@mail.com'}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  placeholder="••••••••"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <label className="flex items-center text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 mr-2" />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-blue-600 hover:underline font-bold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 text-sm uppercase tracking-wider"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social OAuth2 */}
          <div className="mt-6">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Or continue with</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={() => {
                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-google-client-id.apps.googleusercontent.com';
                const redirectUri = encodeURIComponent(import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/oauth2/callback`);
                const scope = encodeURIComponent('email profile');
                window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&prompt=consent`;
              }}
              className="w-full mt-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 border border-slate-200 rounded-2xl transition-all shadow-sm flex items-center justify-center space-x-3 text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>

          <div className="text-center text-slate-500 text-xs font-semibold mt-6 space-y-3">
            <div>
              Don't have an account? <span
                onClick={() => navigate('/register')}
                className="text-blue-600 font-bold hover:underline cursor-pointer ml-1"
              >Register here</span>
            </div>
            
            {/* Quick Autofill Buttons for Testing */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-center items-center gap-2 text-[11px] text-slate-400">
              <span className="font-bold">Quick fill:</span>
              <button 
                type="button"
                onClick={() => {
                  setRole('CUSTOMER');
                  setFormData({ email: 'customer@mail.com', password: 'customer123' });
                }} 
                className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-slate-600"
              >
                Customer
              </button>
              <button 
                type="button"
                onClick={() => {
                  setRole('ADMIN');
                  setFormData({ email: 'lolo@gmail.com', password: 'admin123' });
                }} 
                className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-slate-600"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
