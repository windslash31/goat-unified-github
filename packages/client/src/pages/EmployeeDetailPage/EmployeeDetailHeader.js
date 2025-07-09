import React, { useState, useRef, useEffect } from "react";
import { Edit, UserX, MoreVertical } from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";

export const EmployeeDetailHeader = ({
  employee,
  onEdit,
  onDeactivate,
  permissions,
  isOwnProfile,
}) => {
  const fullName = [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
  ]
    .filter(Boolean)
    .join(" ");
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsActionMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex items-center justify-between">
      <div className="flex items-center">
        <img
          src={`https://i.pravatar.cc/150?u=${employee.employee_email}`}
          alt="User Avatar"
          className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-800"
        />
        <div className="ml-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {fullName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {employee.employee_email}
          </p>
          <div className="mt-2">
            <StatusBadge status={employee.status} />
          </div>
        </div>
      </div>

      {/* Desktop Buttons */}
      <div className="hidden md:flex self-start items-center gap-2">
        {permissions.includes("employee:update") && (
          <Button
            onClick={() => onEdit(employee)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" /> Edit
          </Button>
        )}
        {permissions.includes("employee:deactivate") && !isOwnProfile && (
          <button
            onClick={() => onDeactivate(employee)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            <UserX className="w-4 h-4" /> Suspend Access
          </button>
        )}
      </div>

      {/* Mobile Kebab Menu */}
      <div ref={menuRef} className="md:hidden relative">
        <button
          onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {isActionMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-30">
            <ul>
              {permissions.includes("employee:update") && (
                <li>
                  <button
                    onClick={() => {
                      onEdit(employee);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                </li>
              )}
              {permissions.includes("employee:deactivate") && !isOwnProfile && (
                <li>
                  <button
                    onClick={() => {
                      onDeactivate(employee);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <UserX className="w-4 h-4" /> Suspend Access
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
