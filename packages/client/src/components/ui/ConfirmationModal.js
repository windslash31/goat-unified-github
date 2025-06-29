import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button'; // Import our new Button component

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex items-start">
                        <AlertTriangle className="h-6 w-6 text-red-600 mr-4 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} variant="danger" className="w-full sm:w-auto">
                        Confirm
                    </Button>
                </div>
            </div>
        </div>
    );
};