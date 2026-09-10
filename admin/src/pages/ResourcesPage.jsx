import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Search, Filter, CheckCircle, XCircle, Clock, FileText, Trash2,
  ChevronLeft, ChevronRight, Download, Eye, User, Calendar, Book
} from 'lucide-react';

const ResourcesPage = () => {
  const { isAdmin } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [selectedResources, setSelectedResources] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    academic_year: '',
    page: 1,
    limit: 20,
  });
  
  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchResources();
  }, [filters]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getResources(filters);
      setResources(response.data.data.resources);
      setPagination(response.data.data.pagination);
      setSelectedResources([]);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (resourceId) => {
    if (!window.confirm('Are you sure you want to approve this resource?')) {
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.approveResource(resourceId);
      
      // Update local state
      setResources(resources.map(r => 
        r.id === resourceId ? { ...r, status: 'approved', reviewed_at: new Date() } : r
      ));
      
      alert('Resource approved successfully!');
    } catch (error) {
      console.error('Error approving resource:', error);
      alert('Failed to approve resource');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.rejectResource(selectedResource.id, rejectionReason);
      
      // Update local state
      setResources(resources.map(r => 
        r.id === selectedResource.id 
          ? { ...r, status: 'rejected', rejection_reason: rejectionReason, reviewed_at: new Date() } 
          : r
      ));
      
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedResource(null);
      alert('Resource rejected successfully!');
    } catch (error) {
      console.error('Error rejecting resource:', error);
      alert('Failed to reject resource');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedResources.length === 0) return;
    
    if (!window.confirm(`Approve ${selectedResources.length} selected resources?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.bulkApproveResources(selectedResources);
      fetchResources();
      alert(`${selectedResources.length} resources approved successfully!`);
    } catch (error) {
      console.error('Error bulk approving:', error);
      alert('Failed to approve resources');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.bulkRejectResources(selectedResources, rejectionReason);
      fetchResources();
      setShowBulkRejectModal(false);
      setRejectionReason('');
      alert(`${selectedResources.length} resources rejected successfully!`);
    } catch (error) {
      console.error('Error bulk rejecting:', error);
      alert('Failed to reject resources');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.deleteResource(resourceId);
      setResources(resources.filter(r => r.id !== resourceId));
      alert('Resource deleted successfully!');
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (resource) => {
    setSelectedResource(resource);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const openDetailsModal = (resource) => {
    setSelectedResource(resource);
    setShowDetailsModal(true);
  };

  const toggleSelectAll = () => {
    if (selectedResources.length === resources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(resources.map(r => r.id));
    }
  };

  const toggleSelectResource = (resourceId) => {
    if (selectedResources.includes(resourceId)) {
      setSelectedResources(selectedResources.filter(id => id !== resourceId));
    } else {
      setSelectedResources([...selectedResources, resourceId]);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pending', class: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { text: 'Approved', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { text: 'Rejected', class: 'bg-red-100 text-red-800', icon: XCircle },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const badges = {
      notes: { text: 'Notes', class: 'bg-blue-100 text-blue-800' },
      past_papers: { text: 'Past Papers', class: 'bg-purple-100 text-purple-800' },
      assignments: { text: 'Assignments', class: 'bg-orange-100 text-orange-800' },
      tutorials: { text: 'Tutorials', class: 'bg-green-100 text-green-800' },
    };
    const badge = badges[type] || { text: type, class: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resources Management</h1>
          <p className="text-gray-600 mt-1">Review and manage uploaded study materials</p>
        </div>
        
        {/* Bulk Actions */}
        {selectedResources.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {selectedResources.length} selected
            </span>
            <button
              onClick={handleBulkApprove}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Approve All
            </button>
            <button
              onClick={() => setShowBulkRejectModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject All
            </button>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                placeholder="Search by title, course, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
            >
              <option value="">All Types</option>
              <option value="notes">Notes</option>
              <option value="past_papers">Past Papers</option>
              <option value="assignments">Assignments</option>
              <option value="tutorials">Tutorials</option>
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <input
              type="text"
              value={filters.academic_year}
              onChange={(e) => setFilters({ ...filters, academic_year: e.target.value, page: 1 })}
              placeholder="e.g., 2026/2027"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
            />
          </div>
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={resources.length > 0 && selectedResources.length === resources.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-admin-primary border-gray-300 rounded focus:ring-admin-primary"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploader
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Downloads
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
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No resources found
                  </td>
                </tr>
              ) : (
                resources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedResources.includes(resource.id)}
                        onChange={() => toggleSelectResource(resource.id)}
                        className="w-4 h-4 text-admin-primary border-gray-300 rounded focus:ring-admin-primary"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{resource.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{resource.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400">{formatFileSize(resource.file_size)}</span>
                            {resource.academic_year && (
                              <span className="text-xs text-gray-400">{resource.academic_year}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{resource.unit_code}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{resource.unit_title}</p>
                      <p className="text-xs text-gray-400 mt-1">{resource.program_code}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(resource.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(resource.status)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {resource.uploader_first_name} {resource.uploader_last_name}
                      </p>
                      <p className="text-xs text-gray-500">{resource.uploader_email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {resource.download_count || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {/* View Details */}
                        <button
                          onClick={() => openDetailsModal(resource)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Approve */}
                        {resource.status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(resource.id)}
                            disabled={actionLoading}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reject */}
                        {resource.status !== 'rejected' && (
                          <button
                            onClick={() => openRejectModal(resource)}
                            disabled={actionLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete (Admin only) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(resource.id)}
                            disabled={actionLoading}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Reject Modal */}
      {showRejectModal && selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Resource</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Resource:</p>
              <p className="font-medium text-gray-900">{selectedResource.title}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="4"
                placeholder="Explain why this resource is being rejected..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Resource'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedResource(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Modal */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Bulk Reject Resources</h3>
            
            <p className="text-sm text-gray-600 mb-4">
              You are about to reject {selectedResources.length} resources.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="4"
                placeholder="Explain why these resources are being rejected..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Rejecting...' : 'Reject All'}
              </button>
              <button
                onClick={() => {
                  setShowBulkRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Resource Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Title</p>
                <p className="font-medium text-gray-900">{selectedResource.title}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-900">{selectedResource.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-gray-900">{getTypeBadge(selectedResource.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-gray-900">{getStatusBadge(selectedResource.status)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">File Size</p>
                  <p className="text-gray-900">{formatFileSize(selectedResource.file_size)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Downloads</p>
                  <p className="text-gray-900">{selectedResource.download_count || 0}</p>
                </div>
              </div>

              {selectedResource.academic_year && (
                <div>
                  <p className="text-sm text-gray-600">Academic Year</p>
                  <p className="text-gray-900">{selectedResource.academic_year}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Course</p>
                <p className="font-medium text-gray-900">{selectedResource.unit_code} - {selectedResource.unit_title}</p>
                <p className="text-sm text-gray-500">{selectedResource.program_name} ({selectedResource.program_code})</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Uploaded By</p>
                <p className="text-gray-900">
                  {selectedResource.uploader_first_name} {selectedResource.uploader_last_name}
                </p>
                <p className="text-sm text-gray-500">{selectedResource.uploader_email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Upload Date</p>
                <p className="text-gray-900">{new Date(selectedResource.created_at).toLocaleString()}</p>
              </div>

              {selectedResource.reviewed_at && (
                <div>
                  <p className="text-sm text-gray-600">Reviewed</p>
                  <p className="text-gray-900">{new Date(selectedResource.reviewed_at).toLocaleString()}</p>
                  {selectedResource.reviewer_first_name && (
                    <p className="text-sm text-gray-500">
                      by {selectedResource.reviewer_first_name} {selectedResource.reviewer_last_name}
                    </p>
                  )}
                </div>
              )}

              {selectedResource.rejection_reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-800">{selectedResource.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
