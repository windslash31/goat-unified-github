import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const AccessDeniedPage = () => (
    <div className="p-6 text-center">
        <AlertTriangle className="mx-auto w-12 h-12 text-yellow-500" />
        <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
        <p>You do not have the required permissions to view this page.</p>
    </div>
);
