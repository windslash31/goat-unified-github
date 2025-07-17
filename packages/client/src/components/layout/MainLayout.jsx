import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AskGoatButton } from "../ui/AskGoatButton";
import { AskGoatModal } from "../ui/AskGoatModal";

const MainLayoutComponent = ({ onLogout, permissions, breadcrumbs, user }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isGoatModalOpen, setIsGoatModalOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Toaster
        position="top-right"
        toastOptions={{
          success: { style: { background: "#F0FDF4", color: "#166534" } },
          error: { style: { background: "#FEF2F2", color: "#991B1B" } },
        }}
      />

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      <div className="relative flex h-full w-full">
        <Sidebar
          onLogout={onLogout}
          permissions={permissions}
          isMobileOpen={isMobileSidebarOpen}
          setMobileOpen={setIsMobileSidebarOpen}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            breadcrumbs={breadcrumbs}
            user={user}
            onMenuClick={() => setIsMobileSidebarOpen(true)}
            onLogout={onLogout}
          />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <AskGoatButton onClick={() => setIsGoatModalOpen(true)} />
      <AskGoatModal
        isOpen={isGoatModalOpen}
        onClose={() => setIsGoatModalOpen(false)}
      />
    </div>
  );
};

export const MainLayout = React.memo(MainLayoutComponent);
