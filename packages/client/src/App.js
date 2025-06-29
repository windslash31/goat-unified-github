import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { BreadcrumbProvider, useBreadcrumb } from './context/BreadcrumbContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { EditEmployeeModal } from './components/ui/EditEmployeeModal';
import { DeactivateEmployeeModal } from './components/ui/DeactivateEmployeeModal';
import { AccessDeniedPage } from './components/ui/AccessDeniedPage';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import api from './api/api';

// Lazy load page components for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const EmployeeListPage = lazy(() => import('./pages/EmployeeListPage').then(module => ({ default: module.EmployeeListPage })));
const EmployeeDetailPage = lazy(() => import('./pages/EmployeeDetailPage/EmployeeDetailPage').then(module => ({ default: module.EmployeeDetailPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const ActivityLogPage = lazy(() => import('./pages/ActivityLogPage').then(module => ({ default: module.ActivityLogPage })));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage').then(module => ({ default: module.UserManagementPage })));
const RoleManagementPage = lazy(() => import('./pages/RoleManagementPage').then(module => ({ default: module.RoleManagementPage })));

const fetchMe = async () => {
    const { data } = await api.get('/api/me');
    return data;
};

const fetchEmployees = async (filters, pagination, sorting) => {
    const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
    });
    for (const key in filters) {
        if (filters[key] && filters[key] !== 'all') {
            queryParams.append(key, filters[key]);
        }
    }
    const { data } = await api.get(`/api/employees?${queryParams.toString()}`);
    return data;
};

const AppContent = () => {
    const { isAuthenticated, user, logout, fetchUser } = useAuthStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState(null);
    
    const [filters, setFilters] = useState({ 
        status: 'all', search: '', jobTitle: '', manager: '',
        legal_entity_id: '', office_location_id: '', employee_type_id: '', employee_sub_type_id: '',
        application_id: ''
    });

    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 20 });
    const [sorting, setSorting] = useState({ sortBy: 'first_name', sortOrder: 'asc' });

    const location = useLocation();
    const queryClient = useQueryClient();
    const { dynamicCrumbs, setDynamicCrumbs } = useBreadcrumb();
    
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleOpenEditModal = (employee) => { setEmployeeToEdit(employee); setIsEditModalOpen(true); };
    const handleCloseEditModal = () => { setIsEditModalOpen(false); setEmployeeToEdit(null); };
    const handleOpenDeactivateModal = (employee) => { setEmployeeToEdit(employee); setIsDeactivateModalOpen(true); };
    const handleCloseDeactivateModal = () => { setIsDeactivateModalOpen(false); setEmployeeToEdit(null); };

    const handleLogout = useCallback(async () => {
        await logout();
        queryClient.clear();
    }, [logout, queryClient]);

    const { data: currentUserEmployeeRecord, error: meError } = useQuery({
        queryKey: ['me'],
        queryFn: fetchMe,
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5,
    });

    const { data: employeeData, isLoading: isLoadingEmployees, error: employeesError } = useQuery({
        queryKey: ['employees', filters, pagination.currentPage, sorting],
        queryFn: () => fetchEmployees(filters, pagination, sorting),
        enabled: isAuthenticated && (location.pathname === '/employees'),
        keepPreviousData: true,
        onSuccess: (data) => {
            setPagination(prev => ({ ...prev, totalPages: data.totalPages, totalCount: data.totalCount }));
        }
    });

    useEffect(() => {
        if (meError || employeesError) {
            console.error("A critical query failed:", meError || employeesError);
            handleLogout();
        }
    }, [meError, employeesError, handleLogout]);

    useEffect(() => {
        const nonDynamicPaths = ['/profile', '/employees', '/logs/activity', '/users', '/roles', '/access-denied', '/dashboard', '/'];
        if (nonDynamicPaths.includes(location.pathname)) {
            setDynamicCrumbs([]);
        }
    }, [location.pathname, setDynamicCrumbs]);
    
    const handleUpdateEmployee = (updatedEmployee) => {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        queryClient.invalidateQueries({ queryKey: ['employee', updatedEmployee.id] });
        if (currentUserEmployeeRecord?.id === updatedEmployee.id) {
            queryClient.invalidateQueries({ queryKey: ['me'] });
        }
        handleCloseEditModal();
    };

    const handleDeactivateSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        if (employeeToEdit) {
           queryClient.invalidateQueries({ queryKey: ['employee', employeeToEdit.id] });
        }
        handleCloseDeactivateModal();
    };

    const getBreadcrumbs = () => {
        const pathParts = location.pathname.split('/').filter(p => p);
        const homeCrumb = { name: 'Dashboard', path: '/dashboard' };
        
        const pageTitleMap = { 
            'profile': { name: "Profile", path: "/profile" },
            'employees': { name: "Employees", path: "/employees" },
            'users': { name: "User Management", path: "/users" }, 
            'roles': { name: "Roles & Permissions", path: "/roles" },
            'access-denied': { name: 'Access Denied', path: '/access-denied'},
            'dashboard': { name: 'Dashboard', path: '/dashboard'}
        };

        const crumbs = pathParts.map((part, index) => {
            if(pageTitleMap[part]) {
                return pageTitleMap[part];
            }
            if(part === 'activity' && pathParts[index-1] === 'logs') {
                return { name: "Activity Log", path: "/logs/activity" };
            }
            return null;
        });

        const finalCrumbs = dynamicCrumbs.length > 0 ? [homeCrumb, ...dynamicCrumbs] : [homeCrumb, ...crumbs.filter(Boolean)];
    
        return finalCrumbs;
    };


    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }
    
    if (location.pathname === '/login') {
        return <Navigate to="/dashboard" replace />;
    }

    if (!user) {
        return <div className="p-6 text-center text-lg">Loading Application...</div>;
    }

    return (
        <>
            <Routes>
                <Route 
                    element={
                        <MainLayout 
                            onLogout={handleLogout}
                            permissions={user.permissions}
                            breadcrumbs={getBreadcrumbs()}
                            user={user}
                        />
                    }
                >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/profile" element={<ProfilePage employee={currentUserEmployeeRecord} permissions={user.permissions} onEdit={handleOpenEditModal} onDeactivate={handleOpenDeactivateModal} onLogout={handleLogout} user={user} />} />
                    
                    <Route path="/employees" element={<EmployeeListPage employees={employeeData?.employees || []} isLoading={isLoadingEmployees} filters={filters} setFilters={setFilters} pagination={pagination} setPagination={setPagination} sorting={sorting} setSorting={setSorting} onEdit={handleOpenEditModal} onDeactivate={handleOpenDeactivateModal} />} />
                    <Route path="/employees/:employeeId" element={<EmployeeDetailPage onEdit={handleOpenEditModal} onDeactivate={handleOpenDeactivateModal} permissions={user.permissions} onLogout={handleLogout} />} />
                    <Route path="/logs/activity" element={<ActivityLogPage onLogout={handleLogout} />} />
                    <Route path="/access-denied" element={<AccessDeniedPage />} />
                    
                    <Route element={<ProtectedRoute permission="admin:view_users" />}>
                        <Route path="/users" element={<UserManagementPage onLogout={handleLogout} />} />
                    </Route>
                    <Route element={<ProtectedRoute permission="admin:view_roles" />}>
                        <Route path="/roles" element={<RoleManagementPage onLogout={handleLogout} />} />
                    </Route>
                    
                    <Route path="/" element={<Navigate to="/dashboard" replace />} /> 
                </Route>
            </Routes>
            
            {isEditModalOpen && <EditEmployeeModal employee={employeeToEdit} onClose={handleCloseEditModal} onSave={handleUpdateEmployee} />}
            {isDeactivateModalOpen && <DeactivateEmployeeModal employee={employeeToEdit} onClose={handleCloseDeactivateModal} onDeactivateSuccess={handleDeactivateSuccess} />}
        </>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <BreadcrumbProvider>
                    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center text-lg">Loading Page...</div>}>
                        <AppContent />
                    </Suspense>
                </BreadcrumbProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}