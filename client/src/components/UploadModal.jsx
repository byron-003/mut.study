import React, { useState } from 'react';
import { resourcesAPI } from '../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FileUp, FileText } from 'lucide-react';

const UploadModal = ({ isOpen, onClose, courseId, onSuccess }) => {
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'text'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'notes',
  });
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const resourceTypes = [
    { value: 'notes', label: 'Lecture Notes' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'cat', label: 'CAT' },
    { value: 'practical', label: 'Practical' },
    { value: 'pastpaper', label: 'Past Paper' },
    { value: 'other', label: 'Other' }
  ];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  // Quill editor modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'code-block'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'code-block'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Validate file size
      if (selectedFile.size > maxFileSize) {
        setError('File size must be less than 50MB');
        setFile(null);
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-zip-compressed',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, and ZIP files are allowed.');
        setFile(null);
        return;
      }

      setError('');
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadMode === 'file' && !file) {
      setError('Please select a file to upload');
      return;
    }

    if (uploadMode === 'text' && !textContent.trim()) {
      setError('Please enter some content');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Map frontend types to backend categories
      const typeToCategory = {
        'notes': 'notes',
        'assignment': 'cat',
        'cat': 'cat',
        'practical': 'practical_manual',
        'pastpaper': 'past_paper',
        'other': 'notes'
      };

      if (uploadMode === 'file') {
        // File upload mode
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('courseId', courseId);
        uploadData.append('title', formData.title);
        uploadData.append('description', formData.description);
        uploadData.append('type', formData.type);
        uploadData.append('category', typeToCategory[formData.type] || 'notes');

        await resourcesAPI.uploadResource(uploadData, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        });
      } else {
        // Text content mode - send as form data, no file
        const uploadData = new FormData();
        
        uploadData.append('courseId', courseId);
        uploadData.append('title', formData.title);
        uploadData.append('description', formData.description);
        uploadData.append('type', formData.type);
        uploadData.append('category', typeToCategory[formData.type] || 'notes');
        uploadData.append('isTextContent', 'true');
        uploadData.append('textContent', textContent);

        await resourcesAPI.uploadResource(uploadData, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        });
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'notes',
      });
      setFile(null);
      setTextContent('');
      setUploadMode('file');
      
      // Call success callback
      onSuccess();
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to upload. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFormData({
        title: '',
        description: '',
        type: 'notes',
      });
      setFile(null);
      setTextContent('');
      setError('');
      setUploadProgress(0);
      setUploadMode('file');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Resource
              </h3>
              <button
                onClick={handleClose}
                disabled={uploading}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Mode Selection - Radio buttons */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Input Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Upload File Option */}
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  disabled={uploading}
                  className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all ${
                    uploadMode === 'file'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <FileUp className={`w-8 h-8 mb-2 ${uploadMode === 'file' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${uploadMode === 'file' ? 'text-purple-600' : 'text-gray-700'}`}>
                    Upload File
                  </span>
                  <span className="text-xs text-gray-500 mt-1">PDF, DOC, PPT, ZIP</span>
                  {uploadMode === 'file' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* Create Text Option */}
                <button
                  type="button"
                  onClick={() => setUploadMode('text')}
                  disabled={uploading}
                  className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all ${
                    uploadMode === 'text'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <FileText className={`w-8 h-8 mb-2 ${uploadMode === 'text' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${uploadMode === 'text' ? 'text-purple-600' : 'text-gray-700'}`}>
                    Create Text
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Type or paste content</span>
                  {uploadMode === 'text' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Topic/Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Introduction to Algorithms"
                  className="input-field"
                  required
                  disabled={uploading}
                />
              </div>

              {/* Resource Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                  disabled={uploading}
                >
                  {resourceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the content..."
                  rows="3"
                  className="input-field resize-none"
                  disabled={uploading}
                />
              </div>

              {/* Conditional Content: File Upload OR Text Editor */}
              {uploadMode === 'file' ? (
                /* File Upload */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-purple-500 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-700">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.ppt,.pptx,.odp,.xls,.xlsx,.csv,.ods,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.mp4,.avi,.mov,.wmv,.mkv,.webm,.mp3,.wav,.ogg,.m4a"
                            required={uploadMode === 'file'}
                            disabled={uploading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Documents, presentations, spreadsheets, images, videos up to 50MB
                      </p>
                      {file && (
                        <p className="text-sm text-purple-600 font-medium mt-2">
                          Selected: {file.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Text Editor */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-gray-300 rounded-md overflow-hidden">
                    <ReactQuill
                      theme="snow"
                      value={textContent}
                      onChange={setTextContent}
                      modules={modules}
                      formats={formats}
                      placeholder="Type or paste your content here... You can format text, add lists, links, and more."
                      className="bg-white"
                      style={{ height: '300px', marginBottom: '42px' }}
                      readOnly={uploading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: You can copy and paste formatted text from other sources
                  </p>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{uploadMode === 'file' ? 'Uploading...' : 'Creating...'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (uploadMode === 'file' ? 'Uploading...' : 'Creating...') : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={uploading}
                  className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Your submission will be pending approval by a class rep or admin before being visible to others.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
