'use client';

import React, { useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the confirm button when modal opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100); // Small delay to ensure modal is fully rendered
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  const handleConfirm = () => {
    onConfirm();
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              data-testid="danger-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              data-testid="warning-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              data-testid="info-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    const baseClass = "w-full sm:ml-3 sm:w-auto";
    switch (variant) {
      case 'danger':
        return `${baseClass} bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500`;
      case 'warning':
        return `${baseClass} bg-yellow-600 text-white hover:bg-yellow-700 focus-visible:ring-yellow-500`;
      case 'info':
        return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500`;
      default:
        return `${baseClass} bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500`;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      title={title} // Pass title to Modal for proper aria-labelledby
    >
      <div className="sm:flex sm:items-start">
        {getIcon()}
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <div className="mt-2">
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <Button
          ref={confirmButtonRef}
          variant="primary"
          onClick={handleConfirm}
          loading={loading}
          disabled={loading}
          className={getConfirmButtonClass()}
        >
          {confirmText}
        </Button>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="mt-3 w-full sm:mt-0 sm:w-auto"
        >
          {cancelText}
        </Button>
      </div>
    </Modal>
  );
};