import React, { useState } from 'react';
import { Lock, Key, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AccessCodeGate({ onVerified }) {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-access-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_code: accessCode })
      });

      const data = await response.json();

      if (data.valid) {
        onVerified();
      } else {
        setError('Invalid access code. Please try again.');
      }
    } catch (e) {
      setError('Failed to verify access code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-md w-full mx-4">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Access Required
        </h2>
        <p className="text-slate-400 text-center mb-6">
          Please enter the access code to continue
        </p>

        <form onSubmit={verifyCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Access Code
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !accessCode}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify Access Code'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-4">
          Contact your administrator for the access code
        </p>
      </div>
    </div>
  );
}
