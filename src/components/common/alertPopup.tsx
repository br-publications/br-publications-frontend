import React, { useEffect } from 'react';
import './alertPopup.css';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertPopupProps {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  confirmText?: string;
  showCancel?: boolean;
  cancelText?: string;
  onConfirm?: () => void;
  children?: React.ReactNode;
}

const AlertPopup: React.FC<AlertPopupProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  confirmText = 'OK',
  showCancel = false,
  cancelText = 'Cancel',
  onConfirm,
  children
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (onConfirm) onConfirm();
          else onClose();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="alert-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="alert-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="alert-icon warning" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="alert-icon info" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div className={`alert-popup ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="alert-header">
          {getIcon()}
          <h3 className="alert-title">{title}</h3>
        </div>
        {message && <p className="alert-message">{message}</p>}
        {children}
        <div className="alert-actions">
          {showCancel && (
            <button className="alert-button cancel" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button className={`alert-button ${type}`} onClick={handleConfirm} autoFocus>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertPopup;