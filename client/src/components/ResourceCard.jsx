import React from 'react';
import { formatFileSize, formatDate, getCategoryDisplayName, getCategoryColor, getStatusColor } from '../utils/helpers';
import { resourcesAPI } from '../services/api';
import { useConfirm } from '../hooks/useAlert';
import CustomConfirm from './CustomConfirm';

const ResourceCard = ({ resource, onDelete, showStatus = false, showActions = false }) => {
  const { confirmState, showConfirm } = useConfirm();
  
  const handleDownload = async () => {
    try {
      // Increment download count
      await resourcesAPI.incrementDownloadCount(resource.id);
      
      // Open file in new tab for viewing/downloading
      window.open(resource.fileUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm({
      title: 'Delete Resource',
      message: `Are you sure you want to delete "${resource.title}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    
    if (confirmed) {
      onDelete(resource.id);
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`badge ${getCategoryColor(resource.category)}`}>
              {getCategoryDisplayName(resource.category)}
            </span>
            {showStatus && (
              <span className={`badge ${getStatusColor(resource.status)}`}>
                {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {resource.title}
          </h3>
          
          {resource.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {resource.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {resource.uploader && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{resource.uploader.firstName} {resource.uploader.lastName}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>{formatFileSize(resource.fileSize)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(resource.createdAt)}</span>
            </div>
            
            {resource.downloadCount !== undefined && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{resource.downloadCount} downloads</span>
              </div>
            )}
          </div>

          {resource.rejectionReason && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                <span className="font-medium">Rejection Reason:</span> {resource.rejectionReason}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleDownload}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View/Download
        </button>
        
        {showActions && (
          <button
            onClick={handleDelete}
            className="btn-danger flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        )}
      </div>
      
      <CustomConfirm {...confirmState} />
    </div>
  );
};

export default ResourceCard;
