import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, User, Loader2 } from 'lucide-react';
import { API_BASE_URL, GOOGLE_CLIENT_ID } from '../config';

export default function GoogleAuth({ onAuthChange }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);

    // Check for existing session
    checkExistingSession();

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const checkExistingSession = async () => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          onAuthChange?.(userData);
        } else {
          // Token expired or invalid
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user_data');
        }
      } catch (e) {
        console.error('Session check failed:', e);
      }
    }
    setLoading(false);
  };

  const initializeGoogleSignIn = () => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse
    });

    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      }
    );
  };

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError(null);

    try {
      // Send Google token to backend
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: response.credential
        })
      });

      if (!res.ok) {
        throw new Error('Authentication failed');
      }

      const data = await res.json();

      // Store JWT token
      localStorage.setItem('jwt_token', data.jwt_token);
      localStorage.setItem('user_data', JSON.stringify(data));

      setUser(data);
      onAuthChange?.(data);
    } catch (e) {
      console.error('Google sign-in error:', e);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    setUser(null);
    onAuthChange?.(null);

    // Sign out from Google and reinitialize button
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.prompt();
      // Re-render the button after a short delay
      setTimeout(() => {
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          }
        );
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0 max-w-32">
          <p className="text-xs font-semibold text-white truncate">{user.name || user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <div
        id="google-signin-button"
        className="scale-75 origin-right"
      />
      {error && (
        <p className="text-xs text-red-400 ml-2">{error}</p>
      )}
    </div>
  );
}

// Hook to get current user
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('jwt_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  return { user, loading, getAuthHeader };
}
