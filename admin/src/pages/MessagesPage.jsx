import React, { useState, useEffect } from 'react';
import { Mail, Eye, Reply, Trash2, Archive, MessageSquare, Clock, CheckCircle, Send } from 'lucide-react';
import axios from 'axios';
import { useAlert, useConfirm } from '../hooks/useAlert';
import CustomAlert from '../components/CustomAlert';
import CustomConfirm from '../components/CustomConfirm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MessagesPage = () => {
  const { alertState, showAlert, closeAlert } = useAlert();
  const { confirmState, showConfirm } = useConfirm();
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ unread_count: 0, read_count: 0, replied_count: 0, total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState('all');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [filter]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/contact/messages`, {
        params: { status: filter },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/contact/messages/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewMessage = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/contact/messages/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setSelectedMessage(response.data.data);
      fetchStats(); // Refresh stats after viewing
    } catch (error) {
      console.error('Error fetching message:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    try {
      setSending(true);
      await axios.post(
        `${API_URL}/contact/messages/${selectedMessage.id}/reply`,
        { reply: replyText },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      showAlert('Success', 'Reply sent successfully!', 'success');
      setReplyText('');
      setSelectedMessage(null);
      fetchMessages();
      fetchStats();
    } catch (error) {
      console.error('Error sending reply:', error);
      showAlert('Error', 'Failed to send reply. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/contact/messages/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      fetchMessages();
      fetchStats();
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      showAlert('Error', 'Failed to delete message.', 'error');
    }
  };

  const handleArchive = async (id) => {
    try {
      await axios.patch(
        `${API_URL}/contact/messages/${id}/status`,
        { status: 'archived' },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      fetchMessages();
      fetchStats();
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error archiving message:', error);
      showAlert('Error', 'Failed to archive message.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      unread: { text: 'Unread', color: 'bg-blue-100 text-blue-800', icon: Mail },
      read: { text: 'Read', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
      replied: { text: 'Replied', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      archived: { text: 'Archived', color: 'bg-gray-100 text-gray-800', icon: Archive }
    };
    return badges[status] || badges.unread;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-gray-600 mt-1">Manage and respond to student inquiries</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_count}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unread</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.unread_count}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Read</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.read_count}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Replied</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.replied_count}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'unread', 'read', 'replied', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-admin-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-primary mx-auto"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No messages found</p>
            <p className="text-sm mt-1">Messages will appear here when students contact you</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {messages.map((message) => {
              const statusBadge = getStatusBadge(message.status);
              const StatusIcon = statusBadge.icon;

              return (
                <div
                  key={message.id}
                  className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    message.status === 'unread' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleViewMessage(message.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {message.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{message.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusBadge.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{message.email}</p>
                      <p className="font-medium text-gray-900 mb-1">{message.subject}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{message.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(message.created_at).toLocaleDateString()} {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                        {message.replied_at && (
                          <span className="text-green-600">
                            Replied by {message.replied_by_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(message.id);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(message.id);
                        }}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Message Details</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Message Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">From</p>
                    <p className="font-medium text-gray-900">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedMessage.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Subject</p>
                    <p className="font-medium text-gray-900">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Previous Reply */}
              {selectedMessage.admin_reply && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Previous Reply</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.admin_reply}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Replied by {selectedMessage.replied_by_name} on {new Date(selectedMessage.replied_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Reply Form */}
              {selectedMessage.status !== 'replied' && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Send Reply</h3>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-admin-primary focus:border-transparent resize-none"
                    rows="6"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending}
                    className="mt-4 px-6 py-3 bg-admin-primary text-white rounded-lg hover:bg-admin-secondary transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Reply to {selectedMessage.email}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <CustomAlert {...alertState} onClose={closeAlert} />
      <CustomConfirm {...confirmState} />
    </div>
  );
};

export default MessagesPage;
