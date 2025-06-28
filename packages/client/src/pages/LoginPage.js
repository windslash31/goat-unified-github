import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (response.ok) {
                const data = await response.json();
                onLogin(data.accessToken);
            } else {
                const errData = await response.json();
                setError(errData.message || 'Login failed.');
            }
        } catch (t) {
            setError('Could not connect to the server.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900">
                        <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Sign in to Owl</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <input id="email" name="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-transparent focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Email address" />
                        <input id="password" name="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-transparent focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Password" />
                    </div>
                    {error && <p className="text-center text-sm text-red-500">{error}</p>}
                    <div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
