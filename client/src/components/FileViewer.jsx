import React, { useState, useEffect, useRef } from 'react';
import { Download, X, AlertCircle, CheckCircle, Search, Star, BookOpen } from 'lucide-react';
import { progressAPI } from '../services/api';

/**
 * WhatsApp-style File Viewer Component with Page Tracking
 * Clean, modern UI with action buttons and progress tracking
 */
const FileViewer = ({ file, onClose, onDownload, downloadsEnabled = true, onMarkComplete, savedProgress }) => {
  const [loadError, setLoadError] = useState(false);
  const [viewDuration, setViewDuration] = useState(0);
  const [currentPage, setCurrentPage] = useState(savedProgress?.currentPage || 1);
  const [totalPages, setTotalPages] = useState(savedProgress?.totalPages || null);
  const [isTracking, setIsTracking] = useState(false);
  const iframeRef = useRef(null);
  const progressTimerRef = useRef(null);

  if (!file) return null;

  const { fileUrl, fileType, title, createdAt, id: resourceId } = file;

  // Track viewing time
  useEffect(() => {
    const interval = setInterval(() => {
      setViewDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-save progress every 10 seconds
  useEffect(() => {
    if (!resourceId || !isTracking) return;

    progressTimerRef.current = setInterval(() => {
      saveProgress();
    }, 10000); // Save every 10 seconds

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        saveProgress(); // Save on unmount
      }
    };
  }, [resourceId, currentPage, totalPages, viewDuration, isTracking]);

  // Save progress to backend
  const saveProgress = async () => {
    if (!resourceId) return;

    try {
      if (totalPages) {
        // Page-based tracking for documents
        await progressAPI.updateProgress(resourceId, {
          currentPage,
          totalPages,
          timeSpent: 10, // Increment by 10 seconds
          lastPosition: `page_${currentPage}`
        });
      } else {
        // Percentage-based tracking for other files
        await progressAPI.updateProgress(resourceId, {
          progressPercentage: Math.min(100, Math.floor((viewDuration / 300) * 100)), // 5 mins = 100%
          timeSpent: 10,
          lastPosition: `time_${viewDuration}`
        });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Detect PDF pages using PDF.js
  useEffect(() => {
    const loadPdfJs = async () => {
      const mimeType = fileType?.toLowerCase() || '';
      
      if (mimeType !== 'application/pdf' || !resourceId) return;

      try {
        // Build proxy URL for PDF loading
        const proxyUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/files/view/${resourceId}`;
        
        // Dynamically import PDF.js
        const pdfjsLib = await import('pdfjs-dist');
        
        // Use local worker file (copied to public directory)
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        // Load the PDF from our proxy
        const loadingTask = pdfjsLib.getDocument({
          url: proxyUrl,
          isEvalSupported: false
        });
        const pdf = await loadingTask.promise;
        
        setTotalPages(pdf.numPages);
        setIsTracking(true);
        
        console.log(`PDF loaded: ${pdf.numPages} pages`);
      } catch (error) {
        console.error('Error loading PDF:', error);
        // Fall back to iframe tracking
        setIsTracking(true);
      }
    };

    loadPdfJs();
  }, [fileUrl, fileType, resourceId]);

  // Listen for page changes in Google Docs Viewer (if possible via URL hash)
  useEffect(() => {
    const handleMessage = (event) => {
      // Try to capture page changes from iframe
      if (event.data && event.data.page) {
        setCurrentPage(event.data.page);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Format date like WhatsApp (e.g., "13/09/2026 at 8:06 pm")
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const hour12 = hours % 12 || 12;
    
    return `${day}/${month}/${year} at ${hour12}:${minutes} ${ampm}`;
  };

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

  // Build Google Docs Viewer URL with page parameter
  const buildViewerUrl = () => {
    const mimeType = fileType?.toLowerCase() || '';
    
    if (mimeType === 'application/pdf') {
      // Use our proxy endpoint that serves files inline
      const proxyUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/files/view/${resourceId}`;
      
      // Use Google Docs Viewer with our proxy URL
      let url = `https://docs.google.com/viewer?url=${encodeURIComponent(proxyUrl)}&embedded=true`;
      
      // Try to add page number (not all viewers support this)
      if (savedProgress?.currentPage && savedProgress.currentPage > 1) {
        url += `#page=${savedProgress.currentPage}`;
      }
      
      return url;
    }
    
    return null;
  };

  // Render appropriate viewer based on file type
  const renderViewer = () => {
    const mimeType = fileType?.toLowerCase() || '';
    const proxyUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/files/view/${resourceId}`;

    // PDF files
    if (mimeType === 'application/pdf') {
      const viewerUrl = buildViewerUrl();
      
      return (
        <div className="w-full h-full bg-white">
          <iframe
            ref={iframeRef}
            src={viewerUrl}
            className="w-full h-full border-0"
            title={title}
            onError={() => setLoadError(true)}
          />
        </div>
      );
    }

    // Image files
    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full p-8 bg-white">
          <img
            src={proxyUrl}
            alt={title}
            className="max-w-full max-h-full object-contain shadow-lg"
            onError={() => setLoadError(true)}
          />
        </div>
      );
    }

    // Video files
    if (mimeType.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-full p-8 bg-white">
          <video
            src={proxyUrl}
            controls
            className="max-w-full max-h-full shadow-lg"
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
        <div className="h-full p-8 overflow-auto bg-white">
          <iframe
            src={proxyUrl}
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
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(proxyUrl)}`;
      
      return (
        <iframe
          src={officeViewerUrl}
          className="w-full h-full border-0 bg-white"
          title={title}
          onError={() => setLoadError(true)}
        />
      );
    }

    return null;
  };

  // Get user-friendly file type name
  const getFileTypeName = () => {
    const mimeType = fileType?.toLowerCase() || '';
    
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.includes('wordprocessing')) return 'Word';
    if (mimeType.includes('spreadsheet')) return 'Excel';
    if (mimeType.includes('presentation')) return 'PowerPoint';
    
    return 'Document';
  };

  // Calculate progress percentage
  const progressPercentage = totalPages 
    ? Math.min(100, Math.round((currentPage / totalPages) * 100))
    : savedProgress?.progress || 0;

  return (
    <div className="fixed inset-0 z-50 bg-gray-200">
      <div className="h-full flex flex-col">
        {/* Header - WhatsApp Style */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Left: File Info */}
            <div className="flex-1 min-w-0 mr-4">
              <h3 className="text-base font-medium text-gray-900 truncate">
                {title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{formatDate(createdAt)}</span>
                {totalPages && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Page {currentPage} of {totalPages} ({progressPercentage}%)
                  </span>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Mark Complete Button */}
              {onMarkComplete && (
                <button
                  onClick={onMarkComplete}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Mark as complete"
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </button>
              )}

              {/* Search Button */}
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Search in document"
              >
                <Search className="w-5 h-5 text-gray-700" />
              </button>

              {/* Star Button */}
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Add to favorites"
              >
                <Star className="w-5 h-5 text-gray-700" />
              </button>

              {/* Download Button - Only visible if admin enables downloads */}
              {downloadsEnabled && onDownload && (
                <button
                  onClick={onDownload}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5 text-gray-700" />
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-2"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isTracking && totalPages && (
            <div className="px-4 pb-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Document Viewer */}
          <div className="absolute inset-0">
            {loadError ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-gray-900 text-lg font-semibold mb-2">
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
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-gray-400">{getFileTypeName()}</span>
                </div>
                <p className="text-gray-900 text-lg font-semibold mb-2">
                  Preview not available
                </p>
                <p className="text-gray-600 mb-6">
                  This file type cannot be previewed in the browser.
                </p>
                {downloadsEnabled && onDownload && (
                  <button
                    onClick={onDownload}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
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
    </div>
  );
};

export default FileViewer;
