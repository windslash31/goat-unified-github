import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, KeyRound, Key as KeyIcon, MoreVertical } from 'lucide-react';
import { CreateUserModal } from '../components/ui/CreateUserModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { Portal } from '../components/ui/Portal';
import { TemporaryPasswordModal } from '../components/ui/TemporaryPasswordModal';
import { Button } from '../components/ui/Button';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useAuthStore } from '../stores/authStore';
import api from '../api/api';
import { ApiKeyManagerModal } from '../components/ui/ApiKeyManagerModal';
import { motion } from 'framer-motion';
import { useMediaQuery } from '../hooks/useMediaQuery'; // Import the hook

// Mobile User Card Component
const UserCard = ({ user, currentUser, roleOptions, permissions, onRoleChange, onApiKey, onResetPassword, onDelete }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const canPerformActions = user.id !== currentUser.id;

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-gray-900 dark:text-white">{user.full_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(p => !p)} className="p-2 -mr-2 text-gray-400 hover:text-gray-600">
                        <MoreVertical size={20} />
                    </button>
                    {isMenuOpen && (
                         <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20">
                            <ul>
                                {permissions.includes('user:manage_api_keys') && (
                                    <li><button onClick={() => { onApiKey(user); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"><KeyIcon className="w-4 h-4"/> API Keys</button></li>
                                )}
                                {permissions.includes('user:reset_password') && canPerformActions && (
                                    <li><button onClick={() => { onResetPassword(user); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"><KeyRound className="w-4 h-4"/> Reset Password</button></li>
                                )}
                                 {permissions.includes('user:delete') && canPerformActions && (
                                    <li><button onClick={() => { onDelete(user); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"><Trash2 className="w-4 h-4"/> Delete User</button></li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4">
                <label className="text-xs font-medium text-gray-500">Role</label>
                 <CustomSelect
                    value={user.role_id}
                    options={roleOptions}
                    onChange={onRoleChange(user.id)}
                    placeholder="No Role"
                    disabled={!permissions.includes('user:update:role')}
                />
            </div>
        </div>
    );
}

export const UserManagementPage = ({ onLogout }) => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuthStore();
    const permissions = currentUser?.permissions || [];
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState(null);
    const [newPassword, setNewPassword] = useState(null);

    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [userForApiKey, setUserForApiKey] = useState(null);

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

    const handleRoleChange = (userId) => async (newRoleId) => {
        const originalUsers = [...users];
        const newUsers = users.map(u => u.id === userId ? { ...u, role_id: newRoleId, role_name: roles.find(r => r.id === newRoleId)?.name } : u);
        setUsers(newUsers);

        try {
            await api.put(`/api/users/${userId}/role`, { roleId: newRoleId });
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
            fetchData();
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
    
    const openApiKeyModal = (user) => {
        setUserForApiKey(user);
        setIsApiKeyModalOpen(true);
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
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

                {isDesktop ? (
                    <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                                                    onChange={handleRoleChange(user.id)}
                                                    placeholder="No Role"
                                                    disabled={!permissions.includes('user:update:role')}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    {permissions.includes('user:manage_api_keys') && (
                                                        <button 
                                                            onClick={() => openApiKeyModal(user)} 
                                                            className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                                            title="Manage API Keys"
                                                        >
                                                            <KeyIcon className="w-4 h-4"/>
                                                        </button>
                                                    )}
                                                    {permissions.includes('user:reset_password') && (
                                                        <button 
                                                            onClick={() => openResetModal(user)} 
                                                            disabled={user.id === currentUser.id || user.role_name === 'admin'}
                                                            className="p-2 text-gray-500 hover:text-yellow-600 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Reset Password"
                                                        >
                                                            <KeyRound className="w-4 h-4"/>
                                                        </button>
                                                    )}
                                                    {permissions.includes('user:delete') && (
                                                        <button onClick={() => openDeleteModal(user)} disabled={user.id === currentUser.id} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed" title="Delete User">
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
                ) : (
                    <div className="mt-4 space-y-4">
                        {users.map(user => (
                            <UserCard 
                                key={user.id}
                                user={user}
                                currentUser={currentUser}
                                roleOptions={roleOptions}
                                permissions={permissions}
                                onRoleChange={handleRoleChange}
                                onApiKey={openApiKeyModal}
                                onResetPassword={openResetModal}
                                onDelete={openDeleteModal}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Portal>
                {isCreateModalOpen && <CreateUserModal roles={roles} onClose={() => setIsCreateModalOpen(false)} onUserCreated={(password) => { setIsCreateModalOpen(false); fetchData(); setNewPassword(password); }} />}
                {isDeleteModalOpen && <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteUser} title="Delete User" message={`Are you sure you want to delete the user "${userToDelete?.full_name}"? This will permanently revoke their access.`} />}
                {isResetModalOpen && <ConfirmationModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={handleResetPassword} title="Reset Password" message={`Are you sure you want to reset the password for "${userToReset?.full_name}"? Their old password will no longer work.`} />}
                {newPassword && <TemporaryPasswordModal password={newPassword} onClose={() => setNewPassword(null)} />}
                {isApiKeyModalOpen && userForApiKey && <ApiKeyManagerModal user={userForApiKey} onClose={() => setIsApiKeyModalOpen(false)} />}
            </Portal>
        </motion.div>
    );
};