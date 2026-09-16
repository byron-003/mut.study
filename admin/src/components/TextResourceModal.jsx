import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Sparkles, Edit, Eye, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { adminAPI } from '../services/api';

/**
 * Text Resource Review Modal
 * Allows admin to view, format with AI, edit, and approve text content
 */
const TextResourceModal = ({ resource, onClose, onUpdate, showAlert }) => {
  const [mode, setMode] = useState('view'); // 'view', 'edit'
  const [textContent, setTextContent] = useState(resource.text_content || '');
  const [originalContent] = useState(resource.text_content || '');
  const [formatting, setFormatting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  // Quill editor configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'code-block', 'blockquote'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'code-block', 'blockquote'
  ];

  // Format text with AI
  const handleFormatWithAI = async () => {
    try {
      setFormatting(true);
      const response = await adminAPI.formatTextContent(resource.id);
      
      setTextContent(response.data.data.formattedText);
      setMode('edit'); // Switch to edit mode to show the result
      
      showAlert('Success', `Text formatted successfully with ${response.data.data.model}`, 'success');
    } catch (error) {
      console.error('Error formatting text:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to format text', 'error');
    } finally {
      setFormatting(false);
    }
  };

  // Save edited text
  const handleSave = async () => {
    try {
      setSaving(true);
      await adminAPI.updateTextContent(resource.id, textContent);
      
      // Update parent component
      if (onUpdate) {
        onUpdate({ ...resource, text_content: textContent });
      }
      
      setMode('view');
      showAlert('Success', 'Text content saved successfully', 'success');
    } catch (error) {
      console.error('Error saving text:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to save text', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Approve resource
  const handleApprove = async () => {
    try {
      setApproving(true);
      await adminAPI.approveResource(resource.id);
      
      showAlert('Success', 'Resource approved successfully!', 'success');
      
      // Close modal and refresh
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error approving resource:', error);
      showAlert('Error', 'Failed to approve resource', 'error');
    } finally {
      setApproving(false);
    }
  };

  // Reject resource
  const handleReject = () => {
    // Call parent's reject handler
    onClose();
    // Parent will show reject modal
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setTextContent(originalContent);
    setMode('view');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Text Resource Review</h3>
            <p className="text-sm text-gray-600 mt-1">{resource.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              Uploaded by: <span className="font-medium text-gray-900">
                {resource.uploader_first_name} {resource.uploader_last_name}
              </span>
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">
              {new Date(resource.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {resource.status === 'pending' && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                Pending Review
              </span>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'view' ? (
              <>
                <button
                  onClick={handleFormatWithAI}
                  disabled={formatting}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {formatting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Formatting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI Format
                    </>
                  )}
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Mode:</span>
            <button
              onClick={() => setMode('view')}
              className={`px-3 py-1 text-xs font-medium rounded ${
                mode === 'view'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-3 h-3 inline mr-1" />
              View
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 text-xs font-medium rounded ${
                mode === 'edit'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Edit className="w-3 h-3 inline mr-1" />
              Edit
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {mode === 'view' ? (
            /* View Mode - Rendered HTML */
            <div className="prose max-w-none">
              <div
                className="bg-white rounded-lg p-6 border border-gray-200"
                dangerouslySetInnerHTML={{ __html: textContent }}
              />
            </div>
          ) : (
            /* Edit Mode - Rich Text Editor */
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <ReactQuill
                theme="snow"
                value={textContent}
                onChange={setTextContent}
                modules={modules}
                formats={formats}
                className="bg-white"
                style={{ height: '500px', marginBottom: '42px' }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {resource.status === 'pending' && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Review the content, format if needed, then approve or reject
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReject}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 hover:bg-red-50 text-red-700 rounded-lg transition-colors font-medium"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-medium"
              >
                {approving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextResourceModal;
