import React, { useState, useEffect } from 'react';
import { Lock, Key, Users, Clock, Check, X, Plus, RefreshCw, Shield } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AdminPanel() {
  const [accessCodes, setAccessCodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [oldCode, setOldCode] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [accessDuration, setAccessDuration] = useState(24);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAccessCodes();
    loadUsers();
  }, []);

  const loadAccessCodes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/access-codes`);
      const data = await response.json();
      setAccessCodes(data);
    } catch (e) {
      console.error('Failed to load access codes:', e);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/users`);
      const data = await response.json();
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  };

  const createAccessCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/create-access-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCode)
      });

      const data = await response.json();

      if (data.ok) {
        setMessage('Access code created successfully!');
        setNewCode('');
        loadAccessCodes();
      } else {
        setMessage(data.message || 'Failed to create access code');
      }
    } catch (e) {
      setMessage('Failed to create access code');
    } finally {
      setLoading(false);
    }
  };

  const updateAccessCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/update-access-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_code: oldCode, new_code: newCode })
      });

      const data = await response.json();

      if (data.ok) {
        setMessage('Access code updated successfully!');
        setNewCode('');
        setOldCode('');
        loadAccessCodes();
      } else {
        setMessage(data.message || 'Failed to update access code');
      }
    } catch (e) {
      setMessage('Failed to update access code');
    } finally {
      setLoading(false);
    }
  };

  const setUserAccessDuration = async (userId, duration) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/set-user-access-duration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, duration_hours: duration })
      });

      const data = await response.json();

      if (data.ok) {
        setMessage('User access duration updated successfully!');
        loadUsers();
      } else {
        setMessage(data.message || 'Failed to update access duration');
      }
    } catch (e) {
      setMessage('Failed to update access duration');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId, approved) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/approve-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, approved })
      });

      const data = await response.json();

      if (data.ok) {
        setMessage(`User ${approved ? 'approved' : 'disapproved'} successfully!`);
        loadUsers();
      } else {
        setMessage(data.message || 'Failed to update user approval');
      }
    } catch (e) {
      setMessage('Failed to update user approval');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getAccessStatus = (user) => {
    if (user.is_approved === 0) return { text: 'Not Approved', color: 'text-red-400', bg: 'bg-red-500/10' };
    if (user.access_expires_at) {
      const expiresAt = new Date(user.access_expires_at);
      const now = new Date();
      if (expiresAt < now) return { text: 'Expired', color: 'text-red-400', bg: 'bg-red-500/10' };
      return { text: `Expires ${expiresAt.toLocaleString()}`, color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    }
    return { text: 'Unlimited', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-400" />
          Admin Panel
        </h1>
        <button
          onClick={() => { loadAccessCodes(); loadUsers(); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('success') || message.includes('successfully') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
          {message}
        </div>
      )}

      {/* Access Codes Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-400" />
          Access Codes
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create New Code */}
            <form onSubmit={createAccessCode} className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">Create New Access Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Enter new code"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !newCode}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </button>
              </div>
            </form>

            {/* Update Existing Code */}
            <form onSubmit={updateAccessCode} className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">Update Existing Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={oldCode}
                  onChange={(e) => setOldCode(e.target.value)}
                  placeholder="Current code"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="New code"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !oldCode || !newCode}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Update
                </button>
              </div>
            </form>
          </div>

          {/* Current Access Codes */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-2">Current Access Codes</h3>
            <div className="space-y-2">
              {accessCodes.length === 0 ? (
                <p className="text-slate-500 text-sm">No access codes found</p>
              ) : (
                accessCodes.map((code) => (
                  <div key={code.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-blue-400" />
                      <code className="text-white font-mono">{code.code}</code>
                      <span className={`text-xs px-2 py-1 rounded-full ${code.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{formatDate(code.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Users Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          User Management
        </h2>

        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-slate-500 text-sm">No users found</p>
          ) : (
            users.map((user) => {
              const status = getAccessStatus(user);
              return (
                <div key={user.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name || user.email}</p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-slate-500">Created:</span>
                          <span className="text-slate-300 ml-2">{formatDate(user.created_at)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Last Login:</span>
                          <span className="text-slate-300 ml-2">{formatDate(user.last_login)}</span>
                        </div>
                      </div>

                      <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${status.bg} ${status.color}`}>
                        <Clock className="w-4 h-4" />
                        {status.text}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => approveUser(user.id, user.is_approved === 0)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          user.is_approved === 0
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        }`}
                        disabled={loading}
                      >
                        {user.is_approved === 0 ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {user.is_approved === 0 ? 'Approve' : 'Disapprove'}
                      </button>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Hours"
                          value={selectedUser === user.id ? accessDuration : ''}
                          onChange={(e) => {
                            setSelectedUser(user.id);
                            setAccessDuration(parseInt(e.target.value) || 24);
                          }}
                          className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={loading}
                        />
                        <button
                          onClick={() => setUserAccessDuration(user.id, selectedUser === user.id ? accessDuration : 24)}
                          className="flex-1 px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm transition-colors"
                          disabled={loading}
                        >
                          Set Duration
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/5 rounded-xl border border-blue-500/20 p-6">
        <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          How to Change Access Code
        </h3>
        <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
          <li>To create a new access code, enter it in the "Create New Access Code" field and click Create</li>
          <li>To update an existing code, enter the current code and new code in the "Update Existing Code" fields</li>
          <li>The default access code is <code className="bg-slate-800 px-2 py-1 rounded">OMNI2024</code></li>
          <li>Users must enter a valid access code to access the app</li>
          <li>You can set how long each user can access the app using the "Set Duration" button</li>
          <li>Approve or disapprove users using the Approve/Disapprove button</li>
        </ol>
      </div>
    </div>
  );
}
