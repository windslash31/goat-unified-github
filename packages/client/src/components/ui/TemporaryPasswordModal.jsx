import React, { useState } from 'react';
import { Check, Clipboard, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const TemporaryPasswordModal = ({ password, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(password).then(() => {
            setCopied(true);
            toast.success("Password copied to clipboard!");
            setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
        }, () => {
            toast.error("Failed to copy password.");
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm text-center p-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                    <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">User Created Successfully!</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    A temporary password has been generated. Please copy and share it with the user.
                </p>
                <div className="relative my-4">
                    <input 
                        type="text"
                        readOnly
                        value={password}
                        className="w-full bg-gray-100 dark:bg-gray-900 rounded-md p-3 pr-10 text-center font-mono text-sm"
                    />
                    <button onClick={handleCopy} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700">
                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Clipboard className="w-5 h-5" />}
                    </button>
                </div>
                <button onClick={onClose} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md">
                    Done
                </button>
            </div>
        </div>
    );
};