import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

const OAuth2Callback = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processOAuth2Code = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');

      if (!code) {
        setError('Authorization code was missing from callback URL.');
        return;
      }

      try {
        const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/oauth2/callback`;
        const response = await authApi.loginOAuth2Code({ code, redirectUri });

        const authData = response.data?.data || response.data;
        const token = authData.token;

        if (!token) {
          throw new Error('No JWT token received from server');
        }

        const role = authData.role || 'CUSTOMER';
        localStorage.setItem(role === 'ADMIN' ? 'admin_token' : 'customer_token', token);
        localStorage.setItem('user', JSON.stringify({
          id: authData.id,
          name: authData.name,
          email: authData.email,
          role: role,
          image: authData.image
        }));
        localStorage.setItem('role', role);

        navigate('/dashboard');
      } catch (err) {
        console.error('OAuth2 login failed:', err);
        setError(err.response?.data?.message || err.message || 'OAuth2 authentication failed');
      }
    };

    processOAuth2Code();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Authentication Failed</h2>
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-all"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto text-brand animate-pulse">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Verifying OAuth2 Credentials...</h2>
            <p className="text-sm text-slate-500">Exchanging authorization code and setting up your session.</p>
            <div className="flex justify-center pt-2">
              <Loader2 className="w-6 h-6 text-brand animate-spin" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuth2Callback;
