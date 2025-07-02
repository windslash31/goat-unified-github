import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from './Button';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/api';

interface CreateEmployeeModalProps {
  onClose: () => void;
  onSave: (newEmployee: any) => void;
}

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        employee_email: '',
        position_name: '',
        manager_email: '',
        join_date: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/api/employees', formData);
            toast.success('Employee created successfully!');
            onSave(data);
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create employee.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-kredivo-primary";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
                    onClick={(e) => e.stopPropagation()}
                >
                    <form onSubmit={handleSubmit}>
                        <div className="p-6">
                            <h3 className="text-xl font-semibold">Create New Employee</h3>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="first_name">First Name</label>
                                    <input type="text" name="first_name" id="first_name" required value={formData.first_name} onChange={handleChange} className={inputClasses}/>
                                </div>
                                <div>
                                    <label htmlFor="last_name">Last Name</label>
                                    <input type="text" name="last_name" id="last_name" required value={formData.last_name} onChange={handleChange} className={inputClasses}/>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="employee_email">Email</label>
                                    <input type="email" name="employee_email" id="employee_email" required value={formData.employee_email} onChange={handleChange} className={inputClasses}/>
                                </div>
                                <div>
                                    <label htmlFor="position_name">Position</label>
                                    <input type="text" name="position_name" id="position_name" required value={formData.position_name} onChange={handleChange} className={inputClasses}/>
                                </div>
                                <div>
                                    <label htmlFor="join_date">Join Date</label>
                                    <input type="date" name="join_date" id="join_date" required value={formData.join_date} onChange={handleChange} className={inputClasses}/>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="manager_email">Manager Email (Optional)</label>
                                    <input type="email" name="manager_email" id="manager_email" value={formData.manager_email} onChange={handleChange} className={inputClasses} placeholder="manager@example.com"/>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3">
                            <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Employee'}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};