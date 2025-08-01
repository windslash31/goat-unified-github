import React from "react";
import { Briefcase, Edit, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";

const ManagedAccountsTable = ({ accounts, onEdit, onDelete }) => {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
        <Briefcase className="mx-auto w-12 h-12 text-gray-400" />
        <p className="font-semibold mt-4">No Managed Accounts Found</p>
        <p className="text-sm mt-1">Click "Add Account" to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase"
              >
                Identifier
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase"
              >
                Owner (PIC)
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase"
              >
                Status
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {accounts.map((acc) => (
              <tr
                key={acc.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {acc.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {acc.account_identifier}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {acc.account_type.replace(/_/g, " ")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {acc.owner_first_name ? (
                    `${acc.owner_first_name} ${acc.owner_last_name}`
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {acc.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(acc)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(acc)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagedAccountsTable;
