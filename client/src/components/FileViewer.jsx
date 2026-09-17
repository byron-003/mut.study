import React, { useState, useEffect, useRef } from 'react';
import { Download, X, AlertCircle, CheckCircle, Search, Star, BookOpen, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { progressAPI } from '../services/api';

// Minimum page render scale - pages are never rendered smaller than full width so text stays readable on mobile
const MIN_PAGE_SCALE = 1.5;

/**
 * WhatsApp-style File Viewer Component with Page Tracking
 * Clean, modern UI with action buttons and progress tracking
 */
const FileViewer = ({ file, onClose, onDownload, downloadsEnabled = true, onMarkComplete, savedProgress }) => {
  // Extract the last-read page from currentPage or legacy "page_N" lastPosition records
  const getSavedPage = (progress) => {
    if (progress?.currentPage) return progress.currentPage;
    const match = progress?.lastPosition?.match(/^page_(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const [loadError, setLoadError] = useState(false);
  const [viewDuration, setViewDuration] = useState(0);
  const [currentPage, setCurrentPage] = useState(getSavedPage(savedProgress) || 1);
  const [totalPages, setTotalPages] = useState(savedProgress?.totalPages || null);
  const [isTracking, setIsTracking] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pageZoom, setPageZoom] = useState(1);
  const canvasRefs = useRef({});
  const renderedPagesRef = useRef(new Set());
  const scrollContainerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderPageRef = useRef(null);
  const pageZoomRef = useRef(1);

  if (!file) return null;

  const { fileUrl, fileType, title, createdAt, id: resourceId } = file;
  const isPdf = fileType?.toLowerCase() === 'application/pdf';

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
        console.log(`Progress saved: Page ${currentPage} of ${totalPages}`);
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

  // Load PDF with PDF.js for in-app rendering and page tracking
  useEffect(() => {
    const loadPdfJs = async () => {
      const mimeType = fileType?.toLowerCase() || '';
      
      if (mimeType !== 'application/pdf' || !resourceId) return;

      try {
        // Build proxy URL for PDF loading
        const proxyUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/files/view/${resourceId}`;
        
        setPdfLoading(true);

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
        
        pdfDocRef.current = pdf;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setIsTracking(true);
        setPdfLoading(false);
        
        console.log(`PDF loaded: ${pdf.numPages} pages`);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setLoadError(true);
        setPdfLoading(false);
        setIsTracking(true);
      }
    };

    loadPdfJs();
  }, [fileUrl, fileType, resourceId]);

  // Render a PDF page onto its canvas using a minimum scale so text stays readable on small screens
  async function renderPage(pageNum) {
    const canvas = canvasRefs.current[pageNum];
    if (!canvas || !canvas.isConnected || renderedPagesRef.current.has(pageNum)) return;

    try {
      const pdf = pdfDocRef.current;
      if (!pdf) return;

      const page = await pdf.getPage(pageNum);

      const baseViewport = page.getViewport({ scale: 1 });
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const fitScale = Math.max(containerWidth / baseViewport.width, MIN_PAGE_SCALE);
      const scale = fitScale * pageZoomRef.current;
      const viewport = page.getViewport({ scale });

      // Render at 2x resolution then scale down with CSS for sharper text
      const outputScale = 2;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
        transform: [outputScale, 0, 0, outputScale, 0, 0]
      }).promise;
      renderedPagesRef.current.add(pageNum);
    } catch (error) {
      if (error?.name !== 'RenderingCancelledException') {
        console.error(`Error rendering PDF page ${pageNum}:`, error);
      }
    }
  }
  renderPageRef.current = renderPage;

  // Render PDF pages lazily as they scroll into view and track the visible page
  useEffect(() => {
    if (!pdfDoc) return;

    renderedPagesRef.current = new Set();

    const observer = new IntersectionObserver(
      (entries) => {
        let currentVisible = null;
        let currentRatio = 0;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const pageNum = parseInt(entry.target.dataset.page, 10);
          if (!Number.isInteger(pageNum)) continue;

          renderPage(pageNum);

          if (entry.intersectionRatio > currentRatio) {
            currentRatio = entry.intersectionRatio;
            currentVisible = pageNum;
          }
        }

        if (currentVisible) {
          setCurrentPage(currentVisible);
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 }
    );

    Object.values(canvasRefs.current).forEach((canvas) => {
      if (canvas) observer.observe(canvas);
    });

    return () => observer.disconnect();
  }, [pdfDoc]);

  // Re-render visible pages when the window is resized so scaling stays correct
  useEffect(() => {
    if (!pdfDoc) return;

    const handleResize = () => {
      if (!scrollContainerRef.current) return;
      renderedPagesRef.current = new Set();
      const containerRect = scrollContainerRef.current.getBoundingClientRect();
      Object.values(canvasRefs.current).forEach((canvas) => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
          const pageNum = parseInt(canvas.dataset.page, 10);
          if (Number.isInteger(pageNum)) {
            renderPageRef.current(pageNum);
          }
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDoc]);

  // Re-render visible pages when the zoom level changes and keep the reading position
  useEffect(() => {
    if (!pdfDoc || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const prevZoom = pageZoomRef.current || 1;
    pageZoomRef.current = pageZoom;
    const ratio = pageZoom / prevZoom;
    if (ratio === 1) return;

    container.scrollTop = container.scrollTop * ratio;

    renderedPagesRef.current = new Set();
    const containerRect = container.getBoundingClientRect();
    Object.values(canvasRefs.current).forEach((canvas) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
        const pageNum = parseInt(canvas.dataset.page, 10);
        if (Number.isInteger(pageNum)) {
          renderPageRef.current(pageNum);
        }
      }
    });
  }, [pdfDoc, pageZoom]);

  // Restore viewer to the saved page when the document loads
  useEffect(() => {
    if (!pdfDoc) return;

    const savedPage = getSavedPage(savedProgress);
    if (!savedPage || savedPage <= 1) return;
    if (totalPages && savedPage > totalPages) return;

    // Retry until the target canvas exists (canvases mount after the PDF loads)
    let attempts = 0;
    const timer = setInterval(() => {
      const canvas = canvasRefs.current[savedPage];
      if (canvas) {
        canvas.scrollIntoView({ block: 'start' });
        clearInterval(timer);
      } else if (attempts >= 20) {
        clearInterval(timer);
      }
      attempts += 1;
    }, 100);

    return () => clearInterval(timer);
  }, [pdfDoc, savedProgress?.currentPage, savedProgress?.lastPosition, totalPages]);

  // Scroll the PDF container to a specific page
  const goToPage = (pageNum) => {
    if (!totalPages) return;
    const target = Math.max(1, Math.min(totalPages, pageNum));
    setCurrentPage(target);
    const canvas = canvasRefs.current[target];
    if (canvas) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Adjust the PDF zoom level, clamped to a sensible range
  const zoomChange = (delta) => {
    setPageZoom(prev => Math.min(3, Math.max(0.5, Math.round((prev + delta) * 20) / 20)));
  };

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
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    return previewableTypes.includes(fileType.toLowerCase());
  };

  // Render appropriate viewer based on file type
  const renderViewer = () => {
    const mimeType = fileType?.toLowerCase() || '';
    const proxyUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/files/view/${resourceId}`;

    // PDF files - render in-app with PDF.js
    if (mimeType === 'application/pdf') {
      return (
        <div ref={scrollContainerRef} className="h-full w-full bg-gray-100 overflow-auto">
          <div className="p-4 space-y-4">
            {pdfLoading && !pdfDoc && (
              <div className="flex flex-col items-center gap-3 text-gray-500 py-16">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Loading document...</p>
              </div>
            )}
            {pdfDoc &&
              Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <canvas
                  key={pageNum}
                  ref={(el) => { canvasRefs.current[pageNum] = el; }}
                  data-page={pageNum}
                  className="block shadow-lg bg-white mx-auto"
                  style={{ minHeight: '800px', minWidth: '600px' }}
                />
              ))}
          </div>
        </div>
      );
    }

    // Image files - use proxy for inline viewing
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

    // Video files - use proxy for inline viewing
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

    // Text files - use proxy
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

    // Office documents - use direct Cloudinary URL (Office Viewer needs public access)
    if (
      mimeType.includes('wordprocessingml') ||
      mimeType.includes('spreadsheetml') ||
      mimeType.includes('presentationml') ||
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.ms-excel' ||
      mimeType === 'application/vnd.ms-powerpoint'
    ) {
      // Office Apps Viewer requires public URL
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
      
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

              {/* Zoom Controls - desktop only */}
              {isPdf && (
                <div className="hidden lg:flex items-center gap-0.5 ml-1 border border-gray-200 rounded-lg px-1">
                  <button
                    onClick={() => zoomChange(-0.25)}
                    disabled={pageZoom <= 0.5}
                    className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setPageZoom(1)}
                    className="px-1 min-w-[2.75rem] text-xs font-medium text-gray-700 py-1 hover:bg-gray-100 rounded"
                    title="Reset zoom"
                  >
                    {Math.round(pageZoom * 100)}%
                  </button>
                  <button
                    onClick={() => zoomChange(0.25)}
                    disabled={pageZoom >= 3}
                    className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              )}

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
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  {/* Manual page navigation */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Previous page"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Next page"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <span className="text-xs text-gray-600">{progressPercentage}%</span>
              </div>
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
