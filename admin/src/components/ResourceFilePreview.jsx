import React from 'react';
import { X, ExternalLink, FileWarning } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mut-study.onrender.com/api';

const OFFICE_EXTENSIONS = {
  'application/msword': '.doc',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.oasis.opendocument.text': '.odt',
  'application/vnd.oasis.opendocument.spreadsheet': '.ods',
  'application/vnd.oasis.opendocument.presentation': '.odp',
};

const isOfficeType = (mime) =>
  mime.includes('wordprocessingml') ||
  mime.includes('spreadsheetml') ||
  mime.includes('presentationml') ||
  mime.includes('oasis.opendocument') ||
  mime === 'application/msword' ||
  mime === 'application/vnd.ms-excel' ||
  mime === 'application/vnd.ms-powerpoint';

const ResourceFilePreview = ({ resource, onClose }) => {
  if (!resource) return null;

  const mime = (resource.file_type || '').toLowerCase();
  const viewUrl = `${API_BASE_URL}/files/view/${resource.id}`;

  const renderPreview = () => {
    if (mime.startsWith('image/')) {
      return (
        <img
          src={viewUrl}
          alt={resource.title}
          className="max-w-full max-h-full object-contain"
        />
      );
    }

    if (mime.startsWith('video/')) {
      return (
        <video src={viewUrl} controls className="max-w-full max-h-full">
          Your browser does not support the video tag.
        </video>
      );
    }

    if (mime.startsWith('audio/')) {
      return <audio src={viewUrl} controls className="w-full max-w-xl" />;
    }

    if (mime === 'application/pdf' || mime.startsWith('text/')) {
      return <iframe src={viewUrl} title={resource.title} className="w-full h-full bg-white" />;
    }

    if (isOfficeType(mime)) {
      const ext = OFFICE_EXTENSIONS[mime] || '.doc';
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        `${viewUrl}/document${ext}`
      )}`;
      return <iframe src={officeViewerUrl} title={resource.title} className="w-full h-full bg-white" />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FileWarning className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-900 text-lg font-semibold mb-2">Preview not available</p>
        <p className="text-gray-600 mb-6">This file type cannot be previewed in the browser.</p>
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 bg-admin-primary text-white rounded-lg hover:opacity-90"
        >
          <ExternalLink className="w-5 h-5" />
          Open File
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{resource.title}</h3>
            <p className="text-sm text-gray-500">
              {resource.content_type === 'text' ? 'Text content' : 'File preview'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="w-4 h-4" />
              Open in new tab
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default ResourceFilePreview;
