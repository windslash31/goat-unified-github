import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from './Button';
import { CustomSelect } from './CustomSelect';
import { motion, AnimatePresence } from 'framer-motion';

export const CreateUserModal = ({ roles, onClose, onUserCreated }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        roleId: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (newRoleId) => {
        setFormData(prev => ({ ...prev, roleId: newRoleId }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('accessToken');
        
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create user.');
            }
            
            onUserCreated(data.temporaryPassword);

        } catch (error) {
            toast.error(error.message || 'An error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const roleOptions = roles.map(role => ({ id: role.id, name: role.name }));

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
                >
                    <form onSubmit={handleSubmit}>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New User</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Create a new application account. A temporary password will be generated.
                            </p>
                            <div className="mt-6 space-y-4">
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium">Full Name</label>
                                    <input type="text" name="fullName" id="fullName" required value={formData.fullName} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
                                    <input type="email" name="email" id="email" required value={formData.email} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label htmlFor="roleId" className="block text-sm font-medium">Role</label>
                                    <CustomSelect
                                        id="roleId"
                                        value={formData.roleId}
                                        options={roleOptions}
                                        onChange={handleRoleChange}
                                        placeholder="Select a role..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex justify-end gap-3">
                            <Button type="button" onClick={onClose} disabled={isSubmitting} variant="secondary">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !formData.roleId} variant="primary">
                                {isSubmitting ? 'Creating...' : 'Create User'}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};