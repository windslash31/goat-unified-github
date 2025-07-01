import React, { useState } from 'react'; // Import useState
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProfileDropdown } from './ProfileDropdown'; // We'll need this for the header's mobile view

export const MainLayout = ({ 
    onLogout, 
    permissions, 
    breadcrumbs, 
    user 
}) => {
    // This state now specifically controls the mobile drawer
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="h-screen w-screen flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Toaster position="top-right" toastOptions={{ success: { style: { background: '#F0FDF4', color: '#166534' } }, error: { style: { background: '#FEF2F2', color: '#991B1B' } } }} />
            
            {/* The overlay for when the mobile sidebar is open */}
            {isMobileSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" 
                    onClick={() => setIsMobileSidebarOpen(false)}
                ></div>
            )}

            <div className="relative flex h-full w-full">
                {/* Sidebar component now receives mobile-specific state */}
                <Sidebar 
                    onLogout={onLogout} 
                    permissions={permissions} 
                    isMobileOpen={isMobileSidebarOpen}
                    setMobileOpen={setIsMobileSidebarOpen} // Pass setter to allow closing from within
                />
                
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header 
                        breadcrumbs={breadcrumbs} 
                        user={user} 
                        // The menu click now toggles the mobile-specific state
                        onMenuClick={() => setIsMobileSidebarOpen(true)}
                        onLogout={onLogout}
                    />
                    <main className="flex-1 overflow-y-auto">
                        <Outlet />
                    </main>
                </div>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 flex justify-around items-center md:hidden z-20">
                 {/* This reuses the same user profile dropdown from the header for a consistent experience */}
                 <ProfileDropdown user={user} onLogout={onLogout} />
            </div>
        </div>
    );
};