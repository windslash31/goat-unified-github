import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const login = useAuthStore((state) => state.login);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            // No navigation needed, App.js will react to the store change and navigate away
        } catch (err) {
            // This now provides much better error messages
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                setError(err.response.data.message || 'Invalid credentials or server error.');
            } else if (err.request) {
                // The request was made but no response was received
                setError('Could not connect to the server. Please check your network.');
            } else {
                // Something happened in setting up the request that triggered an Error
                setError('An unexpected error occurred during login.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-kredivo-light">
                        <ShieldCheck className="h-6 w-6 text-kredivo-primary" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Sign in to G.O.A.T</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <input id="email" name="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-transparent focus:outline-none focus:ring-kredivo-primary focus:border-kredivo-primary sm:text-sm" placeholder="Email address" />
                        <input id="password" name="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-transparent focus:outline-none focus:ring-kredivo-primary focus:border-kredivo-primary sm:text-sm" placeholder="Password" />
                    </div>
                    {error && <p className="text-center text-sm text-red-500">{error}</p>}
                    <div>
                        <Button type="submit" disabled={isLoading} className="w-full justify-center" variant="primary">
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};