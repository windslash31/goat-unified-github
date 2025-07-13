import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical,
  Edit,
  UserX,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";
import { useModalStore } from "../../stores/modalStore";
import { StatusBadge } from "../ui/StatusBadge";

export const DesktopTable = React.memo(
  ({
    employees,
    sorting,
    setSorting,
    selectedRows,
    handleSelectAll,
    handleSelectRow,
  }) => {
    const parentRef = useRef(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const actionMenuRef = useRef(null);
    const navigate = useNavigate();
    const { openModal } = useModalStore();

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          actionMenuRef.current &&
          !actionMenuRef.current.contains(event.target)
        ) {
          setActiveActionMenu(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const rowVirtualizer = useVirtualizer({
      count: employees.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 65,
      overscan: 10,
    });

    const TableHeader = ({ children, columnKey }) => {
      const isSorted = sorting.sortBy === columnKey;
      const handleSort = () =>
        setSorting((prev) => ({
          sortBy: columnKey,
          sortOrder: isSorted && prev.sortOrder === "asc" ? "desc" : "asc",
        }));
      return (
        <button
          onClick={handleSort}
          className="flex items-center gap-2 w-full text-left font-bold"
        >
          <span>{children}</span>
          <span className="text-gray-400">
            {isSorted ? (
              sorting.sortOrder === "asc" ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )
            ) : (
              <ChevronsUpDown className="w-4 h-4 opacity-50" />
            )}
          </span>
        </button>
      );
    };

    const virtualItems = rowVirtualizer.getVirtualItems();
    const paddingTop =
      virtualItems.length > 0 ? virtualItems[0]?.start ?? 0 : 0;
    const paddingBottom =
      virtualItems.length > 0
        ? rowVirtualizer.getTotalSize() -
          (virtualItems[virtualItems.length - 1]?.end ?? 0)
        : 0;

    return (
      <div ref={parentRef} className="h-[600px] overflow-auto">
        <table className="min-w-full table-fixed">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 w-[5%] text-left text-xs uppercase text-gray-500">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    employees.length > 0 &&
                    selectedRows.size === employees.length
                  }
                  className="rounded accent-kredivo-primary"
                />
              </th>
              <th className="px-6 py-3 w-[25%] text-left text-xs uppercase text-gray-500">
                <TableHeader columnKey="first_name">Employee</TableHeader>
              </th>
              <th className="px-6 py-3 w-[30%] text-left text-xs uppercase text-gray-500">
                <TableHeader columnKey="employee_email">Email</TableHeader>
              </th>
              <th className="px-6 py-3 w-[20%] text-left text-xs uppercase text-gray-500">
                <TableHeader columnKey="position_name">Job Title</TableHeader>
              </th>
              <th className="px-6 py-3 w-[15%] text-left text-xs uppercase text-gray-500">
                <TableHeader columnKey="status">Status</TableHeader>
              </th>
              <th className="px-6 py-3 w-[5%] text-left text-xs uppercase text-gray-500"></th>
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            {paddingTop > 0 && (
              <tr>
                <td colSpan={6} style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const employee = employees[virtualRow.index];
              const fullName = [
                employee.first_name,
                employee.middle_name,
                employee.last_name,
              ]
                .filter(Boolean)
                .join(" ");

              const itemVariants = {
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              };

              return (
                <motion.tr
                  key={virtualRow.key}
                  variants={itemVariants}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  onClick={() => navigate(`/employees/${employee.id}`)}
                  className={`border-b border-gray-200 dark:border-gray-700 cursor-pointer ${
                    selectedRows.has(employee.id)
                      ? "bg-kredivo-light text-kredivo-dark-text dark:bg-kredivo-primary/20 dark:text-kredivo-light"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      onChange={() => handleSelectRow(employee.id)}
                      checked={selectedRows.has(employee.id)}
                      className="rounded accent-kredivo-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {fullName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {employee.employee_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {employee.position_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={employee.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div
                      className="relative"
                      ref={
                        activeActionMenu === employee.id ? actionMenuRef : null
                      }
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionMenu((prev) =>
                            prev === employee.id ? null : employee.id
                          );
                        }}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeActionMenu === employee.id && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20">
                          <ul>
                            <li>
                              <button
                                onClick={() => {
                                  openModal('editEmployee', employee);
                                  setActiveActionMenu(null);
                                }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit className="w-4 h-4" /> Edit Employee
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => {
                                  openModal('deactivateEmployee', employee);
                                  setActiveActionMenu(null);
                                }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                              >
                                <UserX className="w-4 h-4" /> Suspend Access
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td colSpan={6} style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </motion.tbody>
        </table>
      </div>
    );
  }
);