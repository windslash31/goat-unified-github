import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { AccessDeniedPage } from '../ui/AccessDeniedPage';

export const ProtectedRoute = ({ permission }) => {
    const { user } = useAuthStore();
    const userPermissions = user?.permissions || [];

    if (!userPermissions.includes(permission)) {
        return <AccessDeniedPage />;
    }

    return <Outlet />;
};