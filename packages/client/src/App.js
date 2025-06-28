import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { BreadcrumbProvider } from './context/BreadcrumbContext'; // No need for the hook here
import { ThemeProvider } from './context/ThemeContext';

import { MainLayout } from './components/layout/MainLayout';
import { EditEmployeeModal } from './components/ui/EditEmployeeModal';
import { DeactivateEmployeeModal } from './components/ui/DeactivateEmployeeModal';
import { AccessDeniedPage } from './components/ui/AccessDeniedPage';
import { LoginPage } from './pages/LoginPage';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage/EmployeeDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { RoleManagementPage } from './pages/RoleManagementPage';

const fetchMe = async (token) => {
    if (!token) throw new Error("No token provided");
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 403) throw new Error('Forbidden');
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Could not fetch user profile');
    return response.json();
};

const fetchEmployees = async (token, filters, pagination, sorting) => {
    if (!token) throw new Error("No token provided");
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
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
};

const AppContent = () => {
    const [token, setToken] = useState(localStorage.getItem('accessToken'));
    const [currentUser, setCurrentUser] = useState(null);
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

    const handleOpenEditModal = (employee) => { setEmployeeToEdit(employee); setIsEditModalOpen(true); };
    const handleCloseEditModal = () => { setIsEditModalOpen(false); setEmployeeToEdit(null); };
    const handleOpenDeactivateModal = (employee) => { setEmployeeToEdit(employee); setIsDeactivateModalOpen(true); };
    const handleCloseDeactivateModal = () => { setIsDeactivateModalOpen(false); setEmployeeToEdit(null); };

    const handleLogout = useCallback(async () => {
        const currentToken = localStorage.getItem('accessToken');
        if (currentToken) {
            try {
                await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${currentToken}` }
                });
            } catch (error) {
                console.error("Logout communication failed:", error);
            }
        }
        localStorage.removeItem('accessToken');
        setToken(null);
        setCurrentUser(null);
        queryClient.clear();
    }, [queryClient]);

    useEffect(() => {
        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split('.')[1]));
                setCurrentUser({ ...decoded });
            } catch (e) {
                handleLogout();
            }
        } else {
            setCurrentUser(null);
        }
    }, [token, handleLogout]);

    const { data: currentUserEmployeeRecord, error: meError } = useQuery({
        queryKey: ['me', token],
        queryFn: () => fetchMe(token),
        enabled: !!token,
        staleTime: 1000 * 60 * 5,
    });

    const { data: employeeData, isLoading: isLoadingEmployees, error: employeesError } = useQuery({
        queryKey: ['employees', token, filters, pagination.currentPage, sorting],
        queryFn: () => fetchEmployees(token, filters, pagination, sorting),
        enabled: !!token && (location.pathname === '/employees' || location.pathname === '/'),
        keepPreviousData: true,
        onSuccess: (data) => {
            setPagination(prev => ({ ...prev, totalPages: data.totalPages, totalCount: data.totalCount }));
        }
    });

    useEffect(() => {
        if (meError) {
            console.error("A critical query failed (me):", meError.message);
            handleLogout();
        }
        if (employeesError && location.pathname.startsWith('/employees')) {
            console.error("A critical query failed (employees):", employeesError.message);
            handleLogout();
        }
    }, [meError, employeesError, handleLogout, location.pathname]);
    
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

    const handleLogin = (newToken) => {
        localStorage.setItem('accessToken', newToken);
        setToken(newToken);
    };

    const getBreadcrumbs = () => {
        const pathParts = location.pathname.split('/').filter(p => p);
        const homeCrumb = { name: 'Home', path: '/' };
        
        const pageTitleMap = { 
            'profile': { name: "Profile", path: "/profile" },
            'employees': { name: "Employees", path: "/employees" },
            'users': { name: "User Management", path: "/users" }, 
            'roles': { name: "Roles & Permissions", path: "/roles" },
            'access-denied': { name: 'Access Denied', path: '/access-denied'},
        };

        const crumbs = pathParts.map((part, index) => {
            if(pageTitleMap[part]) {
                return pageTitleMap[part];
            }
            if(part === 'activity' && pathParts[index-1] === 'logs') {
                return { name: "Activity Log", path: "/logs/activity" };
            }
            // For dynamic employee IDs, we can't generate the breadcrumb here easily.
            // This is better handled within the EmployeeDetailPage itself using a context.
            return null;
        });
    
        return [homeCrumb, ...crumbs.filter(Boolean)];
    };


    if (!token) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }
    
    if (location.pathname === '/login') {
        return <Navigate to="/profile" replace />;
    }

    if (!currentUser) {
        return <div className="p-6 text-center text-lg">Loading Application...</div>;
    }

    return (
        <>
            <Routes>
                <Route 
                    element={
                        <MainLayout 
                            onLogout={handleLogout}
                            permissions={currentUser.permissions}
                            breadcrumbs={getBreadcrumbs()}
                            user={currentUser}
                        />
                    }
                >
                    <Route path="/profile" element={<ProfilePage employee={currentUserEmployeeRecord} permissions={currentUser.permissions} onEdit={handleOpenEditModal} onDeactivate={handleOpenDeactivateModal} onLogout={handleLogout} user={currentUser} />} />
                    <Route path="/employees" element={<EmployeeListPage employees={employeeData?.employees || []} isLoading={isLoadingEmployees} filters={filters} setFilters={setFilters} pagination={pagination} setPagination={setPagination} sorting={sorting} setSorting={setSorting} />} />
                    <Route path="/employees/:employeeId" element={<EmployeeDetailPage onEdit={handleOpenEditModal} onDeactivate={handleOpenDeactivateModal} permissions={currentUser.permissions} onLogout={handleLogout} />} />
                    <Route path="/logs/activity" element={<ActivityLogPage onLogout={handleLogout} />} />
                    <Route path="/users" element={<UserManagementPage onLogout={handleLogout} />} />
                    <Route path="/roles" element={<RoleManagementPage onLogout={handleLogout} permissions={currentUser.permissions}/>} />
                    <Route path="/access-denied" element={<AccessDeniedPage />} />
                    <Route path="/" element={<Navigate to="/profile" replace />} /> 
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
                    <AppContent />
                </BreadcrumbProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}