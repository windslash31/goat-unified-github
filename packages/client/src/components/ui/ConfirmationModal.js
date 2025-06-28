import React from 'react';
import { AlertTriangle } from 'lucide-react';

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
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 flex flex-row-reverse">
                    <button type="button" onClick={onConfirm} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                        Confirm
                    </button>
                    <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
