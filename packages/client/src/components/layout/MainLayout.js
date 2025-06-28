import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChevronLeft } from 'lucide-react'; // Import the icon

export const MainLayout = ({ 
    onLogout, 
    permissions, 
    breadcrumbs, 
    user 
}) => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="h-screen w-screen flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Toaster position="top-right" toastOptions={{ success: { style: { background: '#F0FDF4', color: '#166534' } }, error: { style: { background: '#FEF2F2', color: '#991B1B' } } }} />
            
            {isMobileSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" 
                    onClick={() => setIsMobileSidebarOpen(false)}
                ></div>
            )}

            <div className="relative flex h-full w-full">
                <Sidebar 
                    onLogout={onLogout} 
                    permissions={permissions} 
                    isMobileOpen={isMobileSidebarOpen}
                    setMobileOpen={setIsMobileSidebarOpen}
                    isCollapsed={isSidebarCollapsed}
                    setCollapsed={setIsSidebarCollapsed}
                />
                
                {/* Floating Collapse/Expand Button for Desktop */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className={`hidden md:flex absolute top-20 z-50 items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-gray-700 shadow-md ring-1 ring-gray-200 dark:ring-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'left-[72px]' : 'left-[248px]'}`}
                    aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <ChevronLeft className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : 'rotate-0'}`} />
                </button>
                
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header 
                        breadcrumbs={breadcrumbs} 
                        user={user} 
                        onMenuClick={() => setIsMobileSidebarOpen(true)}
                    />
                    <main className="flex-1 overflow-y-auto">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};