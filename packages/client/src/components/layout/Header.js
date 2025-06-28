import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Menu } from 'lucide-react';

export const Header = ({ breadcrumbs, user, onMenuClick }) => {
    const navigate = useNavigate();

    // The last item in the breadcrumbs array is the current page title.
    const currentPage = breadcrumbs[breadcrumbs.length - 1];
    // The second to last item is the parent page for the "Back" button.
    const parentPage = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
            {/* Left Section */}
            <div className="flex items-center min-w-0">
                {/* Mobile: Hamburger Menu */}
                <button onClick={onMenuClick} className="md:hidden mr-2 text-gray-500 hover:text-gray-700">
                    <Menu className="w-6 h-6" />
                </button>

                {/* Mobile: Back Button and Page Title */}
                <div className="flex md:hidden items-center min-w-0">
                    {parentPage && (
                        <button onClick={() => navigate(parentPage.path)} className="mr-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                    <h2 className="text-lg font-semibold truncate">{currentPage?.name}</h2>
                </div>

                {/* Desktop: Breadcrumbs */}
                <nav className="hidden md:flex items-center" aria-label="Breadcrumb">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center min-w-0">
                            {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                            {index === breadcrumbs.length - 1 ? (
                                <span className='font-semibold text-gray-800 dark:text-gray-200 truncate'>
                                    {crumb.name}
                                </span>
                            ) : (
                                <Link to={crumb.path} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 truncate">
                                    {crumb.name}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Right Section: User Info */}
            <div className="flex items-center flex-shrink-0 ml-4">
                <div className="text-right hidden sm:block">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                </div>
                <img src={`https://i.pravatar.cc/150?u=${user.email}`} alt="User Avatar" className="w-10 h-10 rounded-full ml-4 border-2 border-gray-300" />
            </div>
        </header>
    );
};