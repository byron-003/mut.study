import { useState } from 'react';

/**
 * Custom hook for confirmation dialogs
 * Returns [ConfirmDialog component, confirm function]
 * 
 * Usage:
 * const [ConfirmDialog, confirm] = useConfirm();
 * 
 * const handleDelete = async () => {
 *   const isConfirmed = await confirm({
 *     title: 'Delete Item',
 *     message: 'Are you sure?',
 *     type: 'danger'
 *   });
 *   if (isConfirmed) {
 *     // proceed with deletion
 *   }
 * };
 * 
 * return (
 *   <>
 *     <ConfirmDialog />
 *     <button onClick={handleDelete}>Delete</button>
 *   </>
 * );
 */
export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({});
  const [resolvePromise, setResolvePromise] = useState(null);

  const confirm = (options = {}) => {
    return new Promise((resolve) => {
      setConfig({
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'info'
      });
      setIsOpen(true);
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(true);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(false);
    }
  };

  const ConfirmDialog = () => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-4">
            <h3 className="text-xl font-bold text-gray-900">{config.title}</h3>
          </div>

          {/* Message */}
          <div className="px-6 pb-6">
            <p className="text-gray-600 leading-relaxed">{config.message}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-xl">
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {config.cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-5 py-2.5 text-white rounded-lg transition-colors font-medium ${
                config.type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                config.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                config.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {config.confirmText}
            </button>
          </div>
        </div>

        {/* Custom animations */}
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }

          .animate-scaleIn {
            animation: scaleIn 0.2s ease-out;
          }
        `}</style>
      </div>
    );
  };

  return [ConfirmDialog, confirm];
};
