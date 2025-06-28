import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { CreateUserModal } from '../components/ui/CreateUserModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { Portal } from '../components/ui/Portal';
import { TemporaryPasswordModal } from '../components/ui/TemporaryPasswordModal';


export const UserManagementPage = ({ onLogout }) => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [newPassword, setNewPassword] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) { onLogout(); return; }
        try {
            const [usersRes, rolesRes] = await Promise.all([
                fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${process.env.REACT_APP_API_BASE_URL}/api/roles`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (!usersRes.ok || !rolesRes.ok) throw new Error('Failed to fetch data');
            setUsers(await usersRes.json());
            setRoles(await rolesRes.json());
        } catch (err) {
            console.error(err);
            toast.error('Could not load user data.');
        } finally {
            setLoading(false);
        }
    }, [onLogout]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRoleChange = async (userId, newRoleId) => {
        const token = localStorage.getItem('accessToken');
        const originalUsers = [...users];
        const newUsers = users.map(u => u.id === userId ? { ...u, role_id: newRoleId, role_name: roles.find(r => r.id === newRoleId)?.name } : u);
        setUsers(newUsers);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ roleId: newRoleId })
            });
            if (!response.ok) throw new Error('Failed to update role');
            toast.success('User role updated!');
        } catch (err) {
            toast.error(err.message || 'Could not update role.');
            setUsers(originalUsers);
        }
    };

    const openDeleteModal = (user) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        const token = localStorage.getItem('accessToken');

        toast.promise(
            fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => {
                if (!res.ok) return res.json().then(err => { throw new Error(err.message) });
                return res.json();
            }),
            {
                loading: 'Deleting user...',
                success: () => {
                    fetchData(); // Refresh list on success
                    return 'User deleted successfully!';
                },
                error: (err) => err.message || 'Could not delete user.',
            }
        );
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <>
            <div className="p-4 sm:p-6">
                 {/* --- FIX: Added items-center to fix mobile title alignment --- */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Create, delete, and assign roles to users.</p>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="w-full mt-4 sm:mt-0 sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                        <PlusCircle className="w-5 h-5" /> Create User
                    </button>
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
                                <button onClick={() => openDeleteModal(user)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <div className="mt-3">
                                <label htmlFor={`role-select-${user.id}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <select
                                    id={`role-select-${user.id}`}
                                    value={user.role_id || ''}
                                    onChange={(e) => handleRoleChange(user.id, parseInt(e.target.value))}
                                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="" disabled>No Role</option>
                                    {roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}
                                </select>
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={user.role_id || ''}
                                                onChange={(e) => handleRoleChange(user.id, parseInt(e.target.value))}
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                                                style={{ minWidth: '150px' }}
                                            >
                                                <option value="" disabled>No Role</option>
                                                {roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button onClick={() => openDeleteModal(user)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4"/></button>
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
                {newPassword && <TemporaryPasswordModal password={newPassword} onClose={() => setNewPassword(null)} />}
            </Portal>
        </>
    );
};