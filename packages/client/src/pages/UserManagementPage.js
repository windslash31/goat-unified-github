import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, KeyRound } from 'lucide-react';
import { CreateUserModal } from '../components/ui/CreateUserModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { Portal } from '../components/ui/Portal';
import { TemporaryPasswordModal } from '../components/ui/TemporaryPasswordModal';
import { Button } from '../components/ui/Button';
import { CustomSelect } from '../components/ui/CustomSelect'; 
import { useAuthStore } from '../stores/authStore';
import api from '../api/api';

export const UserManagementPage = ({ onLogout }) => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuthStore();
    const permissions = currentUser?.permissions || [];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState(null);
    const [newPassword, setNewPassword] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/api/users'),
                api.get('/api/roles')
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (err) {
            console.error(err);
            toast.error('Could not load user data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRoleChange = async (userId, newRoleId) => {
        const token = localStorage.getItem('accessToken');
        const originalUsers = [...users];
        const newUsers = users.map(u => u.id === userId ? { ...u, role_id: newRoleId, role_name: roles.find(r => r.id === newRoleId)?.name } : u);
        setUsers(newUsers);

        try {
            const response = await api.put(`/api/users/${userId}/role`, { roleId: newRoleId });
            toast.success('User role updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not update role.');
            setUsers(originalUsers);
        }
    };

    const openDeleteModal = (user) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        
        try {
            await api.delete(`/api/users/${userToDelete.id}`);
            toast.success('User deleted successfully!');
            fetchData(); // Refresh list on success
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not delete user.');
        } finally {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };
    
    const openResetModal = (user) => {
        setUserToReset(user);
        setIsResetModalOpen(true);
    };

    const handleResetPassword = async () => {
        if (!userToReset) return;
        
        try {
            const response = await api.post(`/api/users/${userToReset.id}/reset-password`);
            setNewPassword(response.data.temporaryPassword);
            toast.success(`Password for ${userToReset.full_name} has been reset.`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password.');
        } finally {
            setIsResetModalOpen(false);
            setUserToReset(null);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    const roleOptions = roles.map(role => ({ id: role.id, name: role.name }));

    return (
        <>
            <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Create, delete, and assign roles to users.</p>
                    </div>
                    {permissions.includes('user:create') && (
                        <Button onClick={() => setIsCreateModalOpen(true)} className="w-full mt-4 sm:mt-0 sm:w-auto justify-center">
                            <PlusCircle className="w-5 h-5 mr-2" /> Create User
                        </Button>
                    )}
                </div>
                
                {/* Mobile View */}
                <div className="mt-4 space-y-4 md:hidden">
                    {users.map(user => (
                        <div key={user.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{user.full_name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                                <div className="flex items-center">
                                    {permissions.includes('user:reset_password') && (
                                        <button 
                                            onClick={() => openResetModal(user)} 
                                            disabled={user.id === currentUser.id || user.role_name === 'admin'}
                                            className="p-1 text-gray-400 hover:text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <KeyRound className="w-4 h-4" />
                                        </button>
                                    )}
                                    {permissions.includes('user:delete') && (
                                        <button onClick={() => openDeleteModal(user)} disabled={user.id === currentUser.id} className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 className="w-4 h-4" /></button>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3">
                                <label htmlFor={`role-select-${user.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <CustomSelect
                                    id={`role-select-${user.id}`}
                                    value={user.role_id}
                                    options={roleOptions}
                                    onChange={(newRoleId) => handleRoleChange(user.id, newRoleId)}
                                    placeholder="No Role"
                                    disabled={!permissions.includes('user:update:role')}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View */}
                <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Full Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Assigned Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{user.full_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap w-56">
                                            <CustomSelect
                                                value={user.role_id}
                                                options={roleOptions}
                                                onChange={(newRoleId) => handleRoleChange(user.id, newRoleId)}
                                                placeholder="No Role"
                                                disabled={!permissions.includes('user:update:role')}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {permissions.includes('user:reset_password') && (
                                                    <button 
                                                        onClick={() => openResetModal(user)} 
                                                        disabled={user.id === currentUser.id || user.role_name === 'admin'}
                                                        className="p-2 text-gray-500 hover:text-yellow-600 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                                        title="Reset Password"
                                                    >
                                                        <KeyRound className="w-4 h-4"/>
                                                    </button>
                                                )}
                                                {permissions.includes('user:delete') && (
                                                    <button onClick={() => openDeleteModal(user)} disabled={user.id === currentUser.id} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent" title="Delete User">
                                                        <Trash2 className="w-4 h-4"/>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Portal>
                {isCreateModalOpen && <CreateUserModal roles={roles} onClose={() => setIsCreateModalOpen(false)} onUserCreated={(password) => { setIsCreateModalOpen(false); fetchData(); setNewPassword(password); }} />}
                {isDeleteModalOpen && <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteUser} title="Delete User" message={`Are you sure you want to delete the user "${userToDelete?.full_name}"? This will permanently revoke their access.`} />}
                {isResetModalOpen && <ConfirmationModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={handleResetPassword} title="Reset Password" message={`Are you sure you want to reset the password for "${userToReset?.full_name}"? Their old password will no longer work.`} />}
                {newPassword && <TemporaryPasswordModal password={newPassword} onClose={() => setNewPassword(null)} />}
            </Portal>
        </>
    );
};