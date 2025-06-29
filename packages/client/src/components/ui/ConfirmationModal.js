import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
                <div className="p-6 text-center">
                    {/* Centered Icon */}
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3">
                        {/* Centered Title */}
                        <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        {/* Centered Message */}
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Button container with vertical layout for mobile */}
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-4 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <Button 
                        onClick={onClose} 
                        variant="secondary" 
                        className="w-full justify-center sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={onConfirm} 
                        variant="danger" 
                        className="w-full justify-center sm:w-auto"
                    >
                        Confirm
                    </Button>
                </div>
            </div>
        </div>
    );
};