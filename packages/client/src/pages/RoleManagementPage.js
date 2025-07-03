// packages/client/src/pages/RoleManagementPage.js
import React, { useState, useEffect, useCallback } from "react";
import {
  PlusCircle,
  Trash2,
  Save,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../stores/authStore";
import api from "../api/api";
import { motion } from "framer-motion";

const permissionGroups = [
  {
    title: "Application Access",
    permissions: [
      {
        name: "dashboard:view",
        description: "Allows viewing the main dashboard page.",
      },
      {
        name: "profile:read:own",
        description: "Allows user to view their own profile page.",
      },
      {
        name: "admin:view_users",
        description: "Allows viewing the User Management page.",
      },
      {
        name: "admin:view_roles",
        description: "Allows viewing the Roles & Permissions page.",
      },
    ],
  },
  {
    title: "Employee Management",
    permissions: [
      {
        name: "employee:create",
        description: "Allows user to create new employee records.",
      },
      {
        name: "employee:read:all",
        description: "Allows user to view all employees and their profiles.",
      },
      {
        name: "employee:update",
        description: "Allows user to edit existing employee records.",
      },
      {
        name: "employee:deactivate",
        description: "Allows user to manually suspend platform access.",
      },
      {
        name: "employee:delete",
        description: "Allows user to delete an employee record.",
      },
    ],
  },
  {
    title: "User & Role Management",
    permissions: [
      {
        name: "user:create",
        description: "Allows creating a new user account.",
      },
      {
        name: "user:update:role",
        description:
          "Allows assigning a role to a user on the User Management page.",
      },
      { name: "user:delete", description: "Allows deleting a user account." },
      {
        name: "user:reset_password",
        description: "Allows an admin to reset another user's password.",
      },
      {
        name: "role:manage",
        description:
          "Allows creating, deleting, and changing the permissions for a role.",
      },
    ],
  },
  {
    title: "Auditing",
    permissions: [
      {
        name: "log:read",
        description: "Allows user to view the main activity log.",
      },
      {
        name: "log:read:platform",
        description:
          "Allows user to view external platform logs (e.g., JumpCloud).",
      },
    ],
  },
];

const RoleList = ({
  roles,
  selectedRole,
  handleSelectRole,
  permissions,
  openDeleteModal,
  newRoleName,
  setNewRoleName,
  handleCreateRole,
  isCreatingRole,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="p-4">
      <h2 className="font-semibold text-lg mb-3">Roles</h2>
      <ul className="space-y-1">
        {roles.map((role) => (
          <li key={role.id}>
            <button
              onClick={() => handleSelectRole(role)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center ${
                selectedRole?.id === role.id
                  ? "bg-kredivo-light text-kredivo-dark-text dark:bg-kredivo-primary/20 dark:text-kredivo-primary font-semibold"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }`}
            >
              <span>{role.name}</span>
              {permissions.includes("role:manage") &&
                !["admin", "viewer", "auditor"].includes(role.name) && (
                  <Trash2
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(role);
                    }}
                    className="w-4 h-4 text-gray-400 hover:text-red-500"
                  />
                )}
            </button>
          </li>
        ))}
      </ul>
    </div>
    {permissions.includes("role:manage") && (
      <form
        onSubmit={handleCreateRole}
        className="p-4 border-t border-gray-200 dark:border-gray-700"
      >
        <input
          type="text"
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          placeholder="New role name"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:ring-2 focus:ring-kredivo-primary"
        />
        <Button
          type="submit"
          disabled={isCreatingRole}
          className="mt-2 w-full justify-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" />{" "}
          {isCreatingRole ? "Creating..." : "Create Role"}
        </Button>
      </form>
    )}
  </div>
);

const PermissionDetails = ({
  selectedRole,
  allPermissions,
  setIsMobileDetailView,
  handlePermissionChange,
  handleSaveChanges,
  hasUnsavedChanges,
  handleSelectAllGroup,
  isSaving,
}) => {
  const { user: currentUser } = useAuthStore();
  const permissions = currentUser?.permissions || [];

  return (
    <div className="flex-1">
      {selectedRole ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
            <button
              onClick={() => setIsMobileDetailView(false)}
              className="md:hidden p-1 mr-2 -ml-1 text-gray-500"
            >
              <ChevronLeft />
            </button>
            <h2 className="font-semibold text-lg">
              Permissions for '{selectedRole.name}'
            </h2>
          </div>
          <div className="p-6 space-y-6 flex-grow overflow-y-auto">
            {permissionGroups.map((group) => {
              const availablePermissionsInGroup = group.permissions.filter(
                (p) => allPermissions.some((ap) => ap.name === p.name)
              );
              if (availablePermissionsInGroup.length === 0) return null;

              const groupPermissionIds = availablePermissionsInGroup
                .map((p) => allPermissions.find((ap) => ap.name === p.name)?.id)
                .filter(Boolean);
              const isAllSelected = groupPermissionIds.every((id) =>
                selectedRole.permissions.some((sp) => sp.id === id)
              );

              return (
                <div key={group.title}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                      {group.title}
                    </h3>
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        onChange={() =>
                          handleSelectAllGroup(
                            groupPermissionIds,
                            !isAllSelected
                          )
                        }
                        checked={isAllSelected}
                        className="h-4 w-4 rounded border-gray-300 text-kredivo-primary focus:ring-kredivo-primary accent-kredivo-primary"
                      />
                      <span className="ml-2">Select All</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    {availablePermissionsInGroup.map((p) => {
                      const permissionData = allPermissions.find(
                        (ap) => ap.name === p.name
                      );
                      if (!permissionData) return null;
                      return (
                        <label
                          key={permissionData.id}
                          className="flex items-start p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-kredivo-primary focus:ring-kredivo-primary mt-1 accent-kredivo-primary"
                            checked={selectedRole.permissions.some(
                              (sp) => sp.id === permissionData.id
                            )}
                            onChange={(e) =>
                              handlePermissionChange(
                                permissionData.id,
                                e.target.checked
                              )
                            }
                          />
                          <div className="ml-3">
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
                              {p.name}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {p.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {permissions.includes("role:manage") && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges || isSaving}
                variant="primary"
              >
                <Save className="w-4 h-4 mr-2" />{" "}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p>Select a role to view its permissions.</p>
        </div>
      )}
    </div>
  );
};

export const RoleManagementPage = ({ onLogout }) => {
  const { user: currentUser } = useAuthStore();
  const permissions = currentUser?.permissions || [];
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get("/api/roles/with-permissions"),
        api.get("/api/roles/permissions"),
      ]);
      setRoles(rolesRes.data);
      setAllPermissions(permsRes.data);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedRole && roles.length > 0) {
      const currentSelected =
        roles.find((r) => r.id === selectedRole?.id) || roles[0];
      setSelectedRole(currentSelected);
    }
  }, [roles, selectedRole]);

  const handleSelectRole = (role) => {
    if (hasUnsavedChanges) {
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to discard them and switch roles?"
        )
      ) {
        return;
      }
    }
    setSelectedRole(role);
    setHasUnsavedChanges(false);
    if (window.innerWidth < 768) {
      setIsMobileDetailView(true);
    }
  };

  const handlePermissionChange = (permissionId, isChecked) => {
    if (!selectedRole) return;
    setHasUnsavedChanges(true);
    const updatedPermissions = isChecked
      ? [
          ...selectedRole.permissions,
          allPermissions.find((p) => p.id === permissionId),
        ]
      : selectedRole.permissions.filter((p) => p.id !== permissionId);
    setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
  };

  const handleSelectAllGroup = (groupPermissionIds, isSelected) => {
    if (!selectedRole) return;
    setHasUnsavedChanges(true);

    const currentPermissionIds = new Set(
      selectedRole.permissions.map((p) => p.id)
    );
    if (isSelected) {
      groupPermissionIds.forEach((id) => currentPermissionIds.add(id));
    } else {
      groupPermissionIds.forEach((id) => currentPermissionIds.delete(id));
    }

    const updatedPermissions = allPermissions.filter((p) =>
      currentPermissionIds.has(p.id)
    );
    setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
  };

  const handleSaveChanges = async () => {
    if (!selectedRole || !hasUnsavedChanges) return;

    setIsSaving(true);
    const permissionIds = selectedRole.permissions.map((p) => p.id);

    try {
      await api.put(`/api/roles/${selectedRole.id}/permissions`, {
        permissionIds,
      });
      toast.success("Permissions saved successfully!");
      setHasUnsavedChanges(false);
      fetchData();
    } catch (error) {
      toast.error("Could not save permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setIsCreatingRole(true);
    try {
      await api.post("/api/roles", { name: newRoleName.trim() });
      toast.success("Role created successfully!");
      setNewRoleName("");
      fetchData();
    } catch (error) {
      toast.error("Could not create role.");
    } finally {
      setIsCreatingRole(false);
    }
  };

  const openDeleteModal = (role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      await api.delete(`/api/roles/${roleToDelete.id}`);
      toast.success("Role deleted successfully!");
      if (selectedRole?.id === roleToDelete.id) {
        setSelectedRole(null);
        setIsMobileDetailView(false);
      }
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete role.");
    } finally {
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  if (loading)
    return (
      <div className="p-6 text-center">Loading Roles & Permissions...</div>
    );
  if (error)
    return (
      <div className="p-6 text-center text-red-500">
        <AlertTriangle className="mx-auto w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold">Could not load data</h2>
        <p>{error}</p>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 h-full flex flex-col"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Roles & Permissions
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage what users can see and do.
        </p>
      </div>

      <div className="flex-1 md:flex md:gap-6">
        <div
          className={`md:w-1/3 lg:w-1/4 ${
            isMobileDetailView ? "hidden" : "block"
          } md:block`}
        >
          <RoleList
            roles={roles}
            selectedRole={selectedRole}
            handleSelectRole={handleSelectRole}
            permissions={permissions}
            openDeleteModal={openDeleteModal}
            newRoleName={newRoleName}
            setNewRoleName={setNewRoleName}
            handleCreateRole={handleCreateRole}
            isCreatingRole={isCreatingRole}
          />
        </div>

        <div
          className={`flex-1 ${
            isMobileDetailView ? "block" : "hidden"
          } md:block`}
        >
          <PermissionDetails
            selectedRole={selectedRole}
            allPermissions={allPermissions}
            setIsMobileDetailView={setIsMobileDetailView}
            handlePermissionChange={handlePermissionChange}
            handleSaveChanges={handleSaveChanges}
            hasUnsavedChanges={hasUnsavedChanges}
            handleSelectAllGroup={handleSelectAllGroup}
            isSaving={isSaving}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${roleToDelete?.name}"? This action cannot be undone.`}
      />
    </motion.div>
  );
};
