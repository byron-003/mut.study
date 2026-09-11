import React, { useState } from 'react';
import { File, Download, X, AlertCircle } from 'lucide-react';

/**
 * Universal File Viewer Component
 * Handles PDF, images, videos, and other document types
 * Uses file MIME type instead of URL extension
 */
const FileViewer = ({ file, onClose, onDownload, downloadsEnabled = true }) => {
  const [loadError, setLoadError] = useState(false);

  if (!file) return null;

  const { fileUrl, fileType, title } = file;

  // Debug logging
  console.log('FileViewer - File info:', {
    title,
    fileUrl,
    fileType,
    hasFileType: !!fileType
  });

  // Helper to determine if file can be previewed
  const canPreview = () => {
    if (!fileType) return false;

    const previewableTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'text/plain'
    ];

    return previewableTypes.includes(fileType.toLowerCase());
  };

  // Render appropriate viewer based on file type
  const renderViewer = () => {
    const mimeType = fileType?.toLowerCase() || '';

    // PDF files
    if (mimeType === 'application/pdf') {
      // Try Google Docs Viewer as fallback for better compatibility
      const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      
      return (
        <div className="w-full h-full">
          {!loadError ? (
            <>
              {/* Primary: Try direct iframe embed */}
              <iframe
                src={fileUrl}
                className="w-full h-full border-0"
                title={title}
                onError={() => {
                  console.log('Direct PDF embed failed, trying Google Docs Viewer');
                  setLoadError(true);
                }}
              />
              {/* Fallback: Google Docs Viewer (hidden initially) */}
              {loadError && (
                <iframe
                  src={googleDocsUrl}
                  className="w-full h-full border-0"
                  title={title}
                />
              )}
            </>
          ) : (
            <iframe
              src={googleDocsUrl}
              className="w-full h-full border-0"
              title={title}
            />
          )}
        </div>
      );
    }

    // Image files
    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={fileUrl}
            alt={title}
            className="max-w-full max-h-full object-contain"
            onError={() => setLoadError(true)}
          />
        </div>
      );
    }

    // Video files
    if (mimeType.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <video
            src={fileUrl}
            controls
            className="max-w-full max-h-full"
            onError={() => setLoadError(true)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Text files
    if (mimeType === 'text/plain') {
      return (
        <div className="h-full p-4 overflow-auto">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0 bg-white"
            title={title}
            onError={() => setLoadError(true)}
          />
        </div>
      );
    }

    // Office documents (Word, Excel, PowerPoint)
    if (
      mimeType.includes('wordprocessingml') ||
      mimeType.includes('spreadsheetml') ||
      mimeType.includes('presentationml') ||
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.ms-excel' ||
      mimeType === 'application/vnd.ms-powerpoint'
    ) {
      // Use Microsoft Office Online Viewer
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
      
      return (
        <iframe
          src={officeViewerUrl}
          className="w-full h-full border-0"
          title={title}
          onError={() => setLoadError(true)}
        />
      );
    }

    // Unsupported file types
    return null;
  };

  // Get user-friendly file type name
  const getFileTypeName = () => {
    const mimeType = fileType?.toLowerCase() || '';
    
    if (mimeType === 'application/pdf') return 'PDF Document';
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.includes('wordprocessing')) return 'Word Document';
    if (mimeType.includes('spreadsheet')) return 'Excel Spreadsheet';
    if (mimeType.includes('presentation')) return 'PowerPoint Presentation';
    if (mimeType === 'application/zip') return 'ZIP Archive';
    if (mimeType.startsWith('text/')) return 'Text File';
    
    return 'Document';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-lg font-semibold truncate">{title}</h3>
            <p className="text-sm text-gray-400">{getFileTypeName()}</p>
          </div>
          <div className="flex items-center gap-2">
            {downloadsEnabled && onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                title="Download file"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Close viewer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Viewer Content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {loadError ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-gray-700 text-lg font-semibold mb-2">
                Unable to load file preview
              </p>
              <p className="text-gray-600 mb-6">
                There was an error loading the preview. Please download the file to view it.
              </p>
              {downloadsEnabled && onDownload && (
                <button
                  onClick={onDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download File
                </button>
              )}
            </div>
          ) : canPreview() ? (
            renderViewer()
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <File className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-700 text-lg font-semibold mb-2">
                Preview not available
              </p>
              <p className="text-gray-600 mb-2">
                This file type ({getFileTypeName()}) cannot be previewed in the browser.
              </p>
              {!downloadsEnabled && (
                <p className="text-sm text-gray-500 mb-6">
                  Downloads are currently disabled by the administrator.
                </p>
              )}
              {downloadsEnabled && onDownload && (
                <button
                  onClick={onDownload}
                  className="mt-4 flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download to View
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
