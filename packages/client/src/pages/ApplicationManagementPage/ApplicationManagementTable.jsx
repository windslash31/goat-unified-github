import React from "react";
import { Briefcase, Edit, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

const ApplicationManagementTable = ({
  applications,
  onEdit,
  onDelete,
  isSearching,
}) => {
  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
        <Briefcase className="mx-auto w-12 h-12 text-gray-400" />
        <p className="font-semibold mt-4">No Applications Found</p>
        <p className="text-sm mt-1">
          Your search returned no results, or you can click "Onboard" to add
          one.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase w-[35%]">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase w-[25%]">
                Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase w-[20%]">
                Integration Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase w-[20%]">
                Actions
              </th>
            </tr>
          </thead>
          <motion.tbody
            layout
            className={`divide-y divide-gray-200 dark:divide-gray-700 transition-opacity duration-200 ${
              isSearching ? "opacity-60" : "opacity-100"
            }`}
          >
            <AnimatePresence>
              {applications.map((app) => (
                <motion.tr
                  key={app.id}
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium break-words">
                    {app.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono break-words">
                    {app.key}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-1 font-semibold leading-tight text-xs rounded-full bg-gray-100 dark:bg-gray-600">
                      {app.integration_mode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(app)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(app)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </motion.tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationManagementTable;
