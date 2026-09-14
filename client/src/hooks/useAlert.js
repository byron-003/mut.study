import { useState } from 'react';

export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    showViewButton: false,
    onView: null,
    viewButtonText: 'View'
  });

  const showAlert = (title, message, type = 'info', options = {}) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      showViewButton: options.showViewButton || false,
      onView: options.onView || null,
      viewButtonText: options.viewButtonText || 'View'
    });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  return { alertState, showAlert, closeAlert };
};

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const showConfirm = ({
    title,
    message,
    type = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm = () => {},
    onCancel = () => {}
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        onConfirm: () => {
          resolve(true);
          onConfirm();
          closeConfirm();
        },
        onCancel: () => {
          resolve(false);
          onCancel();
          closeConfirm();
        }
      });
    });
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  return { confirmState, showConfirm, closeConfirm };
};
