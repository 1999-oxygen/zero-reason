import React, { useState, useEffect } from 'react';
import { Send, Mail, Inbox, Trash2, Check, AlertCircle, MessageCircle, X } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function UserMessaging({ isAdmin, onClose }) {
  const [messages, setMessages] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadMessages();
    }
  }, [isAdmin, showUnreadOnly]);

  const loadMessages = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/admin/messages?unread_only=${showUnreadOnly}`
      );
      const data = await response.json();
      setMessages(data);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/api/auth/user/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject, message })
      });

      if (!response.ok) throw new Error('Failed to send message');

      setSuccess('Message sent successfully! The admin will respond soon.');
      setSubject('');
      setMessage('');
    } catch (e) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/admin/messages/${messageId}/read`, {
        method: 'PUT'
      });
      loadMessages();
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/auth/admin/messages/${messageId}`, {
        method: 'DELETE'
      });
      loadMessages();
    } catch (e) {
      console.error('Failed to delete message:', e);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (isAdmin) {
    // Admin Inbox View
    const unreadCount = messages.filter(m => !m.read).length;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Inbox className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">User Messages</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-4 border-b border-slate-800">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showUnreadOnly
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {showUnreadOnly ? 'Show All' : 'Show Unread Only'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No messages</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl border transition-all ${
                    msg.read
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-blue-500/5 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{msg.subject}</h4>
                        {!msg.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        From: {msg.user_name} ({msg.user_email})
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(msg.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!msg.read && (
                        <button
                          onClick={() => markAsRead(msg.id)}
                          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-emerald-400" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // User Message Form View
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Contact Admin</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={sendMessage} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question in detail..."
              rows={6}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
              disabled={loading}
            />
          </div>

          {success && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30">
              <Check className="w-4 h-4" />
              {success}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/30">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !subject || !message}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
