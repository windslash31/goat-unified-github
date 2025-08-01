// packages/client/src/components/layout/Header.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Menu } from "lucide-react";
import { useBreadcrumb } from "../../context/BreadcrumbContext";
import { ProfileDropdown } from "./ProfileDropdown";

export const Header = ({ breadcrumbs, user, onLogout, onMenuClick }) => {
  const navigate = useNavigate();
  const { dynamicCrumbs } = useBreadcrumb();
  const finalCrumbs =
    dynamicCrumbs.length > 0
      ? [{ name: "Home", path: "/" }, ...dynamicCrumbs]
      : breadcrumbs;
  const currentPage = finalCrumbs[finalCrumbs.length - 1];
  const parentPage =
    finalCrumbs.length > 1 ? finalCrumbs[finalCrumbs.length - 2] : null;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      <div className="flex items-center min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden mr-2 text-gray-500 hover:text-gray-700"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex md:hidden items-center min-w-0">
          {parentPage && (
            <button
              onClick={() => navigate(-1)}
              className="mr-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
          )}
          <h2 className="text-lg font-semibold truncate">
            {currentPage?.name}
          </h2>
        </div>

        <nav className="hidden md:flex items-center" aria-label="Breadcrumb">
          {finalCrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center min-w-0">
              {index > 0 && <span className="mx-2 text-gray-400">/</span>}
              {index === finalCrumbs.length - 1 ? (
                <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 truncate"
                >
                  {crumb.name}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center flex-shrink-0 ml-4">
        <div className="hidden md:flex flex-col items-end mr-4">
          <span className="font-semibold text-sm text-gray-800 dark:text-white truncate">
            {user.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </span>
        </div>
        <ProfileDropdown user={user} onLogout={onLogout} />
      </div>
    </header>
  );
};