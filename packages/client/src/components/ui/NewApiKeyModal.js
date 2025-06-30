import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Clipboard, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export const NewApiKeyModal = ({ apiKey, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey).then(() => {
            setCopied(true);
            toast.success("API Key copied to clipboard!");
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md text-center p-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">API Key Generated</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Please copy this key and store it securely. You will not be able to see it again.
                </p>
                <div className="relative my-4">
                    <input 
                        type="text"
                        readOnly
                        value={apiKey}
                        className="w-full bg-gray-100 dark:bg-gray-900 rounded-md p-3 pr-10 text-center font-mono text-xs"
                    />
                    <button onClick={handleCopy} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700">
                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Clipboard className="w-5 h-5" />}
                    </button>
                </div>
                <Button onClick={onClose} variant="primary" className="w-full justify-center">
                    Done
                </Button>
            </div>
        </div>
    );
};