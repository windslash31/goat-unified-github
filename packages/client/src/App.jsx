import React, { Suspense, lazy, useCallback, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"; // Added useMutation
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import toast from "react-hot-toast"; // Added for mutation feedback
import { BreadcrumbProvider, useBreadcrumb } from "./context/BreadcrumbContext";
import { ThemeProvider } from "./context/ThemeContext";
import { MainLayout } from "./components/layout/MainLayout";
import { EditEmployeeModal } from "./components/ui/EditEmployeeModal";
import { DeactivateEmployeeModal } from "./components/ui/DeactivateEmployeeModal";
import { AccessDeniedPage } from "./components/ui/AccessDeniedPage";
import { useAuthStore } from "./stores/authStore";
import { useModalStore } from "./stores/modalStore";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import api from "./api/api";

// --- ADDED: Imports for the new modals ---
import { ApplicationFormModal } from "./components/ui/ApplicationFormModal";
import { ConfirmationModal } from "./components/ui/ConfirmationModal";

import { DashboardSkeleton } from "./components/ui/DashboardSkeleton";
import { EmployeeDetailSkeleton } from "./components/ui/EmployeeDetailSkeleton";
import { EmployeeListSkeleton } from "./components/ui/EmployeeListSkeleton";
import { RoleManagementSkeleton } from "./components/ui/RoleManagementSkeleton";
import { UserManagementSkeleton } from "./components/ui/UserManagementSkeleton";
import { ActivityLogSkeleton } from "./components/ui/ActivityLogSkeleton";
import { ApplicationManagementSkeleton } from "./components/ui/ApplicationManagementSkeleton";
import { SettingsSkeleton } from "./components/ui/SettingsSkeleton";

// Lazy load page components for code splitting
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({ default: module.LoginPage }))
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  }))
);
const EmployeeListPage = lazy(() =>
  import("./pages/EmployeeListPage").then((module) => ({
    default: module.EmployeeListPage,
  }))
);
const EmployeeDetailPage = lazy(() =>
  import("./pages/EmployeeDetailPage/EmployeeDetailPage").then((module) => ({
    default: module.EmployeeDetailPage,
  }))
);
const ApplicationManagementPage = lazy(() =>
  import("./pages/ApplicationManagementPage").then((module) => ({
    default: module.ApplicationManagementPage,
  }))
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  }))
);
const ActivityLogPage = lazy(() =>
  import("./pages/ActivityLogPage").then((module) => ({
    default: module.ActivityLogPage,
  }))
);
const UserManagementPage = lazy(() =>
  import("./pages/UserManagementPage").then((module) => ({
    default: module.UserManagementPage,
  }))
);
const RoleManagementPage = lazy(() =>
  import("./pages/RoleManagementPage").then((module) => ({
    default: module.RoleManagementPage,
  }))
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  }))
);
const ManagedAccountsPage = lazy(() =>
  import("./pages/ManagedAccounts/ManagedAccountsPage")
);

const LicensesPage = lazy(() =>
  import("./pages/LicensesPage").then((module) => ({
    default: module.LicensesPage,
  }))
);
const fetchMe = async () => {
  const { data } = await api.get("/api/auth/me");
  return data;
};

const SyncManagementPage = lazy(() => import("./pages/SyncManagementPage"));

const AppContent = () => {
  const { isAuthenticated, user, logout, fetchUser } = useAuthStore();
  const { modal, data: modalData, closeModal } = useModalStore();
  const { dynamicCrumbs, setDynamicCrumbs } = useBreadcrumb();

  const location = useLocation();
  const queryClient = useQueryClient();

  // --- ADDED: Mutation handlers for the new modals ---
  const saveApplicationMutation = useMutation({
    mutationFn: (appData) => {
      if (appData.id) {
        return api.put(`/api/applications/${appData.id}`, appData);
      } else {
        return api.post("/api/applications", appData);
      }
    },
    onSuccess: () => {
      toast.success(`Application successfully saved!`);
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      closeModal();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "An error occurred."),
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: (appId) => api.delete(`/api/applications/${appId}`),
    onSuccess: () => {
      toast.success("Application deleted!");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      closeModal();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete."),
  });

  const handleSaveApplication = (appData) =>
    saveApplicationMutation.mutate(appData);
  const handleDeleteApplication = () =>
    deleteApplicationMutation.mutate(modalData.id);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = useCallback(async () => {
    await logout();
    queryClient.clear();
  }, [logout, queryClient]);

  const { data: currentUserEmployeeRecord, error: meError } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (meError) {
      console.error("A critical query failed:", meError);
      handleLogout();
    }
  }, [meError, handleLogout]);

  useEffect(() => {
    const nonDynamicPaths = [
      "/profile",
      "/employees",
      "/logs/activity",
      "/users",
      "/roles",
      "/access-denied",
      "/dashboard",
      "/settings",
      "/managed-accounts",
    ];
    if (nonDynamicPaths.includes(location.pathname)) {
      setDynamicCrumbs([]);
    }
  }, [location.pathname, setDynamicCrumbs]);

  const handleUpdateEmployee = (updatedEmployee) => {
    queryClient.invalidateQueries({ queryKey: ["employees"] });
    queryClient.invalidateQueries({
      queryKey: ["employee", updatedEmployee.id],
    });
    if (currentUserEmployeeRecord?.id === updatedEmployee.id) {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    }
    closeModal();
  };

  const handleDeactivateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["employees"] });
    if (modalData) {
      queryClient.invalidateQueries({
        queryKey: ["employee", modalData.id],
      });
    }
    closeModal();
  };

  const getBreadcrumbs = (dynamicCrumbs) => {
    const pathParts = location.pathname.split("/").filter((p) => p);
    const homeCrumb = { name: "Home", path: "/dashboard" };

    if (location.pathname === "/dashboard" || location.pathname === "/") {
      return [homeCrumb];
    }

    const pageTitleMap = {
      profile: { name: "Profile", path: "/profile" },
      employees: { name: "Employees", path: "/employees" },
      settings: { name: "Settings", path: "/settings" },
      users: { name: "User Management", path: "/settings/users" },
      roles: { name: "Roles & Permissions", path: "/settings/roles" },
      applications: {
        name: "Application Management",
        path: "/settings/applications",
      },
      "access-denied": { name: "Access Denied", path: "/access-denied" },
      logs: { name: "Logs" },
      activity: { name: "Activity Log", path: "/logs/activity" },
      "managed-accounts": {
        name: "Managed Accounts",
        path: "/managed-accounts",
      },
    };
    const crumbs = pathParts.reduce((acc, part) => {
      const mappedCrumb = pageTitleMap[part];
      if (mappedCrumb && mappedCrumb.path) {
        acc.push(mappedCrumb);
      }
      return acc;
    }, []);
    const finalCrumbs =
      dynamicCrumbs.length > 0
        ? [homeCrumb, ...dynamicCrumbs]
        : [homeCrumb, ...crumbs];

    return finalCrumbs;
  };

  if (!isAuthenticated) {
    return (
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center text-lg">
            Loading...
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  if (!user) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <Routes location={location} key={location.pathname}>
        <Route
          element={
            <MainLayout
              onLogout={handleLogout}
              permissions={user.permissions}
              breadcrumbs={getBreadcrumbs(dynamicCrumbs)}
              user={user}
            />
          }
        >
          <Route element={<ProtectedRoute permission="dashboard:view" />}>
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <DashboardPage />
                </Suspense>
              }
            />
          </Route>

          <Route
            path="/profile"
            element={
              <Suspense fallback={<EmployeeDetailSkeleton />}>
                <ProfilePage
                  employee={currentUserEmployeeRecord}
                  permissions={user.permissions}
                  onLogout={handleLogout}
                  user={user}
                />
              </Suspense>
            }
          />

          <Route
            path="/employees"
            element={
              <Suspense fallback={<EmployeeListSkeleton count={10} />}>
                <EmployeeListPage />
              </Suspense>
            }
          />
          <Route
            path="/employees/:employeeId"
            element={
              <Suspense fallback={<EmployeeDetailSkeleton />}>
                <EmployeeDetailPage
                  permissions={user.permissions}
                  onLogout={handleLogout}
                />
              </Suspense>
            }
          />
          <Route
            element={<ProtectedRoute permission="managed_account:manage" />}
          >
            <Route
              path="/managed-accounts"
              element={
                <Suspense fallback={<EmployeeListSkeleton count={5} />}>
                  <ManagedAccountsPage />
                </Suspense>
              }
            />
          </Route>

          <Route element={<ProtectedRoute permission="license:manage" />}>
            <Route
              path="/licenses"
              element={
                <Suspense fallback={<EmployeeListSkeleton count={8} />}>
                  <LicensesPage />
                </Suspense>
              }
            />
          </Route>

          <Route element={<ProtectedRoute permission="log:read" />}>
            <Route
              path="/logs/activity"
              element={
                <Suspense fallback={<ActivityLogSkeleton />}>
                  <ActivityLogPage onLogout={handleLogout} />
                </Suspense>
              }
            />
          </Route>

          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* --- SETTINGS ROUTES SECTION --- */}
          <Route
            path="/settings"
            element={
              <Suspense fallback={<SettingsSkeleton />}>
                <SettingsPage />
              </Suspense>
            }
          >
            <Route
              path="users"
              element={
                <Suspense fallback={<UserManagementSkeleton />}>
                  <UserManagementPage />
                </Suspense>
              }
            />
            <Route
              path="roles"
              element={
                <Suspense fallback={<RoleManagementSkeleton />}>
                  <RoleManagementPage />
                </Suspense>
              }
            />
            <Route
              path="applications"
              element={
                <Suspense fallback={<ApplicationManagementSkeleton />}>
                  <ApplicationManagementPage />
                </Suspense>
              }
            />
            {/* The new sync route, correctly closed */}
            <Route
              path="sync"
              element={
                <Suspense fallback={<SettingsSkeleton />}>
                  <SyncManagementPage />
                </Suspense>
              }
            />
          </Route>
          {/* --- END SETTINGS ROUTES --- */}

          <Route
            path="/"
            element={
              user.permissions.includes("dashboard:view") ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/profile" replace />
              )
            }
          />
        </Route>
      </Routes>

      {modal === "editEmployee" && (
        <EditEmployeeModal
          employee={modalData}
          onClose={closeModal}
          onSave={handleUpdateEmployee}
        />
      )}
      {modal === "deactivateEmployee" && (
        <DeactivateEmployeeModal
          employee={modalData}
          onClose={closeModal}
          onDeactivateSuccess={handleDeactivateSuccess}
        />
      )}

      {/* --- ADDED: Conditional rendering for the new modals --- */}
      {modal === "applicationForm" && (
        <ApplicationFormModal
          app={modalData}
          onClose={closeModal}
          onSave={handleSaveApplication}
          isSaving={saveApplicationMutation.isPending}
        />
      )}
      {modal === "deleteApplication" && (
        <ConfirmationModal
          isOpen={true}
          onClose={closeModal}
          onConfirm={handleDeleteApplication}
          title="Delete Application"
          message={`Are you sure you want to delete "${modalData.name}"? This cannot be undone.`}
          confirmationText={modalData.name}
        />
      )}
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <BreadcrumbProvider>
        <AppContent />
      </BreadcrumbProvider>
    </ThemeProvider>
  );
}
