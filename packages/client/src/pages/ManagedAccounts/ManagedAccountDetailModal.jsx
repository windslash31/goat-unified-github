import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserCog, Briefcase } from "lucide-react";
import api from "../../api/api";
import { EmployeeListSkeleton } from "../../components/ui/EmployeeListSkeleton";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { AccessStatusBadge } from "../../components/ui/AccessStatusBadge";
import { Button } from "../../components/ui/Button";
import { Drawer } from "../../components/ui/Drawer";
import { DetailItem } from "../../components/ui/DetailItem";
// --- FIX: Corrected the import path to the new, shared component ---
import { AppDetailsDrawerContent } from "../EmployeeDetailPage/AppDetailsDrawerContent";

// Data Fetching
const fetchAccountLicenses = (accountId) =>
  api
    .get(`/api/managed-accounts/${accountId}/licenses`)
    .then((res) => res.data);
const fetchPlatformStatuses = (accountId) =>
  api
    .get(`/api/managed-accounts/${accountId}/platform-statuses`)
    .then((res) => res.data);

const ManagedAccountDetailModal = ({ account, onClose }) => {
  const [mainTab, setMainTab] = useState("Applications");
  const [selectedApp, setSelectedApp] = useState(null);

  const { data: licenses, isLoading: isLoadingLicenses } = useQuery({
    queryKey: ["managedAccountLicenses", account?.id],
    queryFn: () => fetchAccountLicenses(account?.id),
    enabled: !!account?.id,
  });

  const { data: platformStatuses, isLoading: isLoadingPlatforms } = useQuery({
    queryKey: ["managedAccountPlatformStatuses", account?.id],
    queryFn: () => fetchPlatformStatuses(account?.id),
    enabled: !!account?.id,
  });

  const { items } = useMemo(() => {
    if (!platformStatuses && !licenses) return { items: [] };

    const connectedApps = (platformStatuses || []).map((p) => {
      const isSuspended = p.status === "Suspended" || p.status === "Inactive";
      const exists = p.status !== "Not Found";
      let access = "Granted";
      if (!exists) access = "Not found";
      else if (isSuspended) access = "Suspended";
      else access = "Active";
      return {
        appId: p.platform.toLowerCase(),
        appName: p.platform,
        category: "External Service",
        ax: {
          type: "external",
          access: access,
          lastUpdated: p.details?.last_synced_at,
          connected: true,
        },
      };
    });

    const licensedApps = (licenses || []).map((l) => ({
      appId: l.application_name.toLowerCase().replace(/\s/g, "-"),
      appName: l.application_name,
      category: l.application_category || "Uncategorized",
      ax: { type: "external", access: "Granted", connected: false },
    }));

    const allItemsMap = new Map();
    licensedApps.forEach((app) => allItemsMap.set(app.appName, app));
    connectedApps.forEach((app) => allItemsMap.set(app.appName, app));

    return { items: Array.from(allItemsMap.values()) };
  }, [platformStatuses, licenses]);

  const isLoading = isLoadingLicenses || isLoadingPlatforms;

  return (
    <AnimatePresence>
      {account && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col"
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCog />
                {account.name}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="bg-white dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Account Details
                </h4>
                <DetailItem
                  label="Identifier"
                  value={account.account_identifier}
                />
                <DetailItem
                  label="Type"
                  value={account.account_type.replace(/_/g, " ")}
                />
                <DetailItem label="Status" value={account.status} />
                <DetailItem
                  label="Owner (PIC)"
                  value={
                    `${account.owner_first_name || ""} ${
                      account.owner_last_name || ""
                    }`.trim() || "Unassigned"
                  }
                />
              </div>

              <SegmentedControl
                value={mainTab}
                onChange={setMainTab}
                options={["Applications", "Licenses"]}
              />
              {isLoading ? (
                <EmployeeListSkeleton count={3} />
              ) : mainTab === "Applications" ? (
                <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="hidden md:grid grid-cols-12 bg-neutral-100 dark:bg-neutral-900 text-sm px-4 py-3 font-semibold">
                    <div className="col-span-6">Application</div>
                    <div className="col-span-3">Access</div>
                    <div className="col-span-3 text-right"></div>
                  </div>
                  <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {items.map((app) => (
                      <li
                        key={app.appId}
                        className="block md:grid md:grid-cols-12 items-center px-4 py-3"
                      >
                        <div className="col-span-6 font-medium">
                          {app.appName}
                        </div>
                        <div className="col-span-3 mt-2 md:mt-0">
                          <AccessStatusBadge access={app.ax.access} />
                        </div>
                        <div className="col-span-3 flex justify-start md:justify-end mt-2 md:mt-0">
                          {app.ax.connected && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedApp(app)}
                            >
                              Details
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {licenses.map((lic) => (
                      <li
                        key={lic.assignment_id}
                        className="py-3 px-4 flex items-center gap-3"
                      >
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {lic.application_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {lic.application_category}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      <Drawer
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title={`${selectedApp?.appName} Access Details`}
      >
        {selectedApp && (
          <AppDetailsDrawerContent
            app={selectedApp}
            accountId={account.id}
            platformStatus={platformStatuses.find(
              (p) => p.platform === selectedApp.appName
            )}
          />
        )}
      </Drawer>
    </AnimatePresence>
  );
};

export default ManagedAccountDetailModal;
