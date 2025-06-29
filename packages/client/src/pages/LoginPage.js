import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button'; // Import new button

export const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                <div className="text-center">
                    {/* --- Use new brand color --- */}
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-kredivo-light">
                        <ShieldCheck className="h-6 w-6 text-kredivo-primary" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Sign in to Owl</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        {/* --- Use new brand color on focus --- */}
                        <input id="email" name="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-transparent focus:outline-none focus:ring-kredivo-primary focus:border-kredivo-primary sm:text-sm" placeholder="Email address" />
                        <input id="password" name="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-transparent focus:outline-none focus:ring-kredivo-primary focus:border-kredivo-primary sm:text-sm" placeholder="Password" />
                    </div>
                    {error && <p className="text-center text-sm text-red-500">{error}</p>}
                    <div>
                        {/* --- Use new Button component --- */}
                        <Button type="submit" disabled={isLoading} className="w-full justify-center">
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};