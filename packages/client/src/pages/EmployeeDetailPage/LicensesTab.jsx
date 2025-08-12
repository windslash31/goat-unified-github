import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/api";
import { Info, Briefcase } from "lucide-react";
import { EmployeeListSkeleton } from "../../components/ui/EmployeeListSkeleton";

const fetchEmployeeAssignments = async (employeeId) => {
  const { data } = await api.get(`/api/employees/${employeeId}/assignments`);
  return data;
};

export const LicensesTab = ({ employeeId }) => {
  const {
    data: assignments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["employeeAssignments", employeeId],
    queryFn: () => fetchEmployeeAssignments(employeeId),
  });

  if (isLoading) {
    return <EmployeeListSkeleton count={3} />;
  }

  if (error) {
    return (
      <div className="text-center p-6 text-red-500">
        Could not fetch license details.
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Info className="mx-auto w-12 h-12 text-gray-400" />
        <p className="mt-4 font-semibold">No Licensed Applications Found</p>
        <p className="text-sm">
          This employee has no paid licenses assigned from the central tracking
          system.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.assignment_id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <Briefcase className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {assignment.application_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {assignment.application_category}
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                assignment.source === "MANUAL"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
              }`}
            >
              {assignment.source === "MANUAL"
                ? "Manual Assignment"
                : "Automated Sync"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
