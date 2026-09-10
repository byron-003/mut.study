import React, { useState, useEffect } from 'react';
import { resourcesAPI } from '../services/api';
import { formatFileSize, formatDate, getCategoryDisplayName, getCategoryColor } from '../utils/helpers';

const PendingApprovalsPage = () => {
  const [pendingResources, setPendingResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingResources();
  }, []);

  const fetchPendingResources = async () => {
    try {
      const response = await resourcesAPI.getPendingResources();
      setPendingResources(response.data.data);
    } catch (error) {
      console.error('Error fetching pending resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this resource?')) return;

    setActionLoading(id);
    try {
      await resourcesAPI.approveResource(id);
      setPendingResources(pendingResources.filter(r => r.id !== id));
      alert('Resource approved successfully!');
    } catch (error) {
      console.error('Error approving resource:', error);
      alert('Failed to approve resource');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setActionLoading(id);
    try {
      await resourcesAPI.rejectResource(id, reason);
      setPendingResources(pendingResources.filter(r => r.id !== id));
      alert('Resource rejected');
    } catch (error) {
      console.error('Error rejecting resource:', error);
      alert('Failed to reject resource');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mut-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pending Approvals</h1>

        {pendingResources.length > 0 ? (
          <div className="space-y-6">
            {pendingResources.map((resource) => (
              <div key={resource.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <span className={`badge ${getCategoryColor(resource.category)} mb-2 inline-block`}>
                      {getCategoryDisplayName(resource.category)}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-gray-600 mb-3">{resource.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Course:</span> {resource.course.code} - {resource.course.title}
                      </div>
                      <div>
                        <span className="font-medium">Program:</span> {resource.program.name}
                      </div>
                      <div>
                        <span className="font-medium">Uploader:</span> {resource.uploader.firstName} {resource.uploader.lastName}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {resource.uploader.email}
                      </div>
                      <div>
                        <span className="font-medium">File Size:</span> {formatFileSize(resource.fileSize)}
                      </div>
                      <div>
                        <span className="font-medium">Uploaded:</span> {formatDate(resource.createdAt)}
                      </div>
                    </div>

                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mut-primary hover:underline text-sm"
                    >
                      View File →
                    </a>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(resource.id)}
                    disabled={actionLoading === resource.id}
                    className="btn-success disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(resource.id)}
                    disabled={actionLoading === resource.id}
                    className="btn-danger disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No pending resources to review.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovalsPage;
