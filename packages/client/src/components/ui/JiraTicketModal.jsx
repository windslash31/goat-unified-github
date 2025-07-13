import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Portal } from './Portal';
import { X, ExternalLink, User, CheckSquare, Calendar, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from './Button';
import { motion, AnimatePresence } from 'framer-motion';

const fetchTicketDetails = async (ticketId, token) => {
    if (!ticketId || !token) return null;
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jira/ticket/${ticketId}`, { // Changed from process.env.REACT_APP_API_BASE_URL
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch Jira ticket details.');
    }
    return response.json();
};

const DetailRow = ({ icon, label, value }) => (
    <div className="flex items-center text-sm">
        <div className="w-1/3 text-gray-500 dark:text-gray-400 flex items-center">
            {icon}
            <span className="ml-2">{label}</span>
        </div>
        <div className="w-2/3 text-gray-800 dark:text-gray-200 font-medium">{value}</div>
    </div>
);


export const JiraTicketModal = ({ ticketId, onClose }) => {
    const token = localStorage.getItem('accessToken');
    const { data: ticket, error, isLoading } = useQuery({
        queryKey: ['jiraTicket', ticketId],
        queryFn: () => fetchTicketDetails(ticketId, token),
        enabled: !!ticketId && !!token,
    });

    useEffect(() => {
        if(error) toast.error(error.message);
    }, [error]);

    const jiraBaseUrl = import.meta.env.VITE_JIRA_BASE_URL || `https://${import.meta.env.VITE_ATLASSIAN_DOMAIN}/browse/`; // Changed from process.env
    
    return (
        <Portal>
            <AnimatePresence>
                {ticketId && (
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
                            transition={{ duration: 0.2 }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Jira Ticket: {ticketId}</h3>
                                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="p-6">
                                {isLoading && (
                                    <div className="flex justify-center items-center h-48">
                                        <Loader className="w-8 h-8 animate-spin text-kredivo-primary" />
                                    </div>
                                )}
                                {error && (
                                    <div className="text-center h-48 flex flex-col justify-center items-center text-red-500">
                                        <p className="font-semibold">Could not load ticket details.</p>
                                        <p className="text-sm">{error.message}</p>
                                    </div>
                                )}
                                {ticket && (
                                    <div className="space-y-4">
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{ticket.summary}</p>
                                        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <DetailRow icon={<CheckSquare size={16}/>} label="Status" value={ticket.status} />
                                            <DetailRow icon={<User size={16}/>} label="Assignee" value={ticket.assignee} />
                                            <DetailRow icon={<User size={16}/>} label="Reporter" value={ticket.reporter} />
                                            <DetailRow icon={<Calendar size={16}/>} label="Created" value={new Date(ticket.created).toLocaleString()} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex justify-end">
                                <a href={`${jiraBaseUrl}${ticketId}`} target="_blank" rel="noopener noreferrer">
                                    <Button variant="primary">
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Open in Jira
                                    </Button>
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Portal>
    );
};