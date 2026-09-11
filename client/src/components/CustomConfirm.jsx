import React from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

const CustomConfirm = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning' // 'warning' or 'danger'
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full transform transition-all animate-fadeIn">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${
          isDanger ? 'bg-red-50 border-b border-red-200' : 'bg-yellow-50 border-b border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            {isDanger ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <HelpCircle className="w-6 h-6 text-yellow-600" />
            )}
            <h3 className={`text-lg font-bold ${isDanger ? 'text-red-900' : 'text-yellow-900'}`}>
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className={`text-base ${isDanger ? 'text-red-800' : 'text-yellow-800'}`}>
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-2.5 rounded-lg font-medium text-white transition-colors shadow-md ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomConfirm;
