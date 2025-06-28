import React from 'react';
import { User } from 'lucide-react';

export const WelcomePage = ({ user }) => (
    <div className="p-6 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-w-lg mx-auto p-8">
            <User className="mx-auto w-16 h-16 text-blue-500" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user.name}!</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Your user account is active and you are successfully logged in.</p>
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-300">
                <p className="font-semibold">Your employee profile has not been created in the system yet. Please contact an IT administrator to set up your employee record.</p>
            </div>
        </div>
    </div>
);