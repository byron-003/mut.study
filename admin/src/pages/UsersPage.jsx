import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useAlert, useConfirm } from '../hooks/useAlert';
import CustomAlert from '../components/CustomAlert';
import CustomConfirm from '../components/CustomConfirm';
import {
  Search, Filter, UserCheck, UserX, Edit, ChevronLeft, ChevronRight,
  Mail, GraduationCap, Calendar, Shield, User, Star
} from 'lucide-react';

const UsersPage = () => {
  const { isAdmin } = useAuth();
  const { alertState, showAlert, closeAlert } = useAlert();
  const { confirmState, showConfirm } = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 1,
    limit: 20,
  });
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers(filters);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (user) => {
    const confirmed = await showConfirm({
      title: `${user.is_active ? 'Deactivate' : 'Activate'} User`,
      message: `Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`,
      type: user.is_active ? 'danger' : 'warning',
      confirmText: user.is_active ? 'Deactivate' : 'Activate',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.updateUserStatus(user.id, !user.is_active);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      ));
      
      showAlert('Success', `User ${!user.is_active ? 'activated' : 'deactivated'} successfully!`, 'success');
    } catch (error) {
      console.error('Error updating user status:', error);
      showAlert('Error', 'Failed to update user status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async () => {
    try {
      setActionLoading(true);
      await adminAPI.updateUserRole(selectedUser.id, newRole);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, role: newRole } : u
      ));
      
      setShowRoleModal(false);
      setSelectedUser(null);
      showAlert('Success', 'User role updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating user role:', error);
      showAlert('Error', 'Failed to update user role', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClassRepToggle = async (user) => {
    const newStatus = !user.is_class_rep;
    const confirmMessage = newStatus
      ? `Grant ${user.first_name} ${user.last_name} class representative privileges? They will be able to create courses for their program.`
      : `Revoke class representative privileges from ${user.first_name} ${user.last_name}?`;

    const confirmed = await showConfirm({
      title: newStatus ? 'Grant Class Rep Status' : 'Revoke Class Rep Status',
      message: confirmMessage,
      type: 'warning',
      confirmText: newStatus ? 'Grant' : 'Revoke',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.updateClassRepStatus(user.id, newStatus);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, is_class_rep: newStatus } : u
      ));
      
      showAlert('Success', `Class representative privileges ${newStatus ? 'granted' : 'revoked'} successfully!`, 'success');
    } catch (error) {
      console.error('Error updating class rep status:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to update class rep status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const getRoleBadge = (role) => {
    const badges = {
      student: { text: 'Student', class: 'bg-blue-100 text-blue-800' },
      admin: { text: 'Admin', class: 'bg-purple-100 text-purple-800' },
    };
    const badge = badges[role] || badges.student;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-1">Manage all registered users</p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
            >
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year/Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class Rep
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-admin-primary rounded-full flex items-center justify-center text-white font-bold">
                          {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{user.program_code || 'N/A'}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{user.program_name || 'No program'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.current_year && user.current_semester ? (
                        <p className="text-sm text-gray-900">
                          Y{user.current_year} S{user.current_semester}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">Not set</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_class_rep ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 fill-current" />
                          Class Rep
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {/* Toggle Status */}
                        <button
                          onClick={() => handleStatusToggle(user)}
                          disabled={actionLoading}
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          } disabled:opacity-50`}
                          title={user.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        {/* Toggle Class Rep (Admin only, not for admins) */}
                        {isAdmin && user.role !== 'admin' && (
                          <button
                            onClick={() => handleClassRepToggle(user)}
                            disabled={actionLoading}
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_class_rep
                                ? 'text-yellow-600 hover:bg-yellow-50'
                                : 'text-gray-600 hover:bg-gray-50'
                            } disabled:opacity-50`}
                            title={user.is_class_rep ? 'Revoke Class Rep' : 'Make Class Rep'}
                          >
                            <Star className={`w-4 h-4 ${user.is_class_rep ? 'fill-current' : ''}`} />
                          </button>
                        )}

                        {/* Change Role (Admin only) */}
                        {isAdmin && (
                          <button
                            onClick={() => openRoleModal(user)}
                            disabled={actionLoading}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Change Role"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        pagination.page === pageNum
                          ? 'bg-admin-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Change User Role</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">User:</p>
              <p className="font-medium text-gray-900">
                {selectedUser.first_name} {selectedUser.last_name}
              </p>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
              >
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <strong>Note:</strong> To grant class representative privileges, use the star (⭐) button on the user row instead of changing the role.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRoleChange}
                disabled={actionLoading || newRole === selectedUser.role}
                className="flex-1 bg-admin-primary text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Updating...' : 'Update Role'}
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <CustomAlert {...alertState} onClose={closeAlert} />
      <CustomConfirm {...confirmState} />
    </div>
  );
};

export default UsersPage;
