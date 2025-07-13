import React from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../ui/StatusBadge";

export const MobileList = React.memo(({ employees }) => (
  <div className="divide-y divide-gray-200 dark:divide-gray-700">
    {employees.map((emp) => {
      const fullName = [emp.first_name, emp.middle_name, emp.last_name]
        .filter(Boolean)
        .join(" ");
      return (
        <Link
          to={`/employees/${emp.id}`}
          key={emp.id}
          className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {fullName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {emp.employee_email}
              </p>
            </div>
            <StatusBadge status={emp.status} />
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <p>{emp.position_name || "No position specified"}</p>
          </div>
        </Link>
      );
    })}
  </div>
));