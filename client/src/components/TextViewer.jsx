import React, { useState } from 'react';
import { X, CheckCircle, Search, Star, Download, Copy, Check } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * Text Content Viewer Component
 * Displays rich text content stored in the database
 */
const TextViewer = ({ resource, onClose, onMarkComplete }) => {
  const [viewDuration, setViewDuration] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!resource) return null;

  const { title, text_content, createdAt } = resource;

  // Track viewing time
  React.useEffect(() => {
    const interval = setInterval(() => {
      setViewDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format date
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

  // Copy content to clipboard
  const handleCopy = async () => {
    try {
      // Convert HTML to plain text for copying
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text_content;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download as HTML file
  const handleDownload = () => {
    const blob = new Blob([text_content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
              <p className="text-xs text-gray-500">
                {formatDate(createdAt)} • Text Content
              </p>
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

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-700" />
                )}
              </button>

              {/* Star Button */}
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Add to favorites"
              >
                <Star className="w-5 h-5 text-gray-700" />
              </button>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Download as HTML"
              >
                <Download className="w-5 h-5 text-gray-700" />
              </button>

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
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Content with MarkdownRenderer for beautiful display */}
            <MarkdownRenderer content={text_content} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextViewer;
