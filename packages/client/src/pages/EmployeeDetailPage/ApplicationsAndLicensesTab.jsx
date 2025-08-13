import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/api";
import {
  Search,
  ChevronRight,
  BadgeCheck,
  CircleAlert,
  X,
  Shield,
  CheckCircle2,
  Cpu,
  Grid2X2,
  DollarSign,
  Calendar,
  Receipt,
  Code,
  GitBranch,
  Book,
  KeyRound,
} from "lucide-react";
import { formatTimeAgo, formatDateTime } from "../../utils/formatters";
import { EmployeeListSkeleton } from "../../components/ui/EmployeeListSkeleton";
import { Button } from "../../components/ui/Button";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { AccessStatusBadge } from "../../components/ui/AccessStatusBadge";
import { Drawer } from "../../components/ui/Drawer";
import { PermissionBadge } from "../../components/ui/PermissionBadge";
import { AppDetailsDrawerContent } from "./AppDetailsDrawerContent";

// --- Data Fetching Functions ---
const fetchEmployeePlatformStatus = (employeeId) =>
  api
    .get(`/api/employees/${employeeId}/platform-statuses`)
    .then((res) => res.data);
const fetchEmployeeAssignments = (employeeId) =>
  api.get(`/api/employees/${employeeId}/assignments`).then((res) => res.data);
const fetchAllLicenseData = () =>
  api.get(`/api/licenses`).then((res) => res.data);
const fetchDetailedAccess = (employeeId) =>
  api
    .get(`/api/employees/${employeeId}/application-access`)
    .then((res) => res.data);

// --- Child Components ---
const AppAvatar = ({ name }) => {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center font-semibold text-neutral-700 dark:text-neutral-200">
      {initials}
    </div>
  );
};

const SummaryChip = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 rounded-2xl border bg-neutral-100 dark:bg-gray-900/50 border-neutral-200 dark:border-gray-700/50 p-3">
    <div className="flex-shrink-0 rounded-lg bg-neutral-200 dark:bg-gray-700 text-neutral-600 dark:text-neutral-300 p-2">
      {React.cloneElement(icon, { className: "h-5 w-5" })}
    </div>
    <div>
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <dt className="text-sm text-gray-500 dark:text-gray-400 w-1/3 pr-2">
      {label}
    </dt>
    <dd className="text-sm text-right font-medium w-2/3">{value}</dd>
  </div>
);

export const ApplicationsAndLicensesTab = ({ employee }) => {
  const [mainTab, setMainTab] = useState("Applications");
  const [selectedApp, setSelectedApp] = useState(null);

  const { data: platformStatuses, isLoading: isLoadingPlatforms } = useQuery({
    queryKey: ["platformStatuses", employee.id],
    queryFn: () => fetchEmployeePlatformStatus(employee.id),
  });

  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["employeeAssignments", employee.id],
    queryFn: () => fetchEmployeeAssignments(employee.id),
  });

  const { data: allLicenseData, isLoading: isLoadingAllLicenses } = useQuery({
    queryKey: ["allLicenseData"],
    queryFn: fetchAllLicenseData,
  });

  const { items, lastSyncedAt, appSummary } = useMemo(() => {
    if (!platformStatuses || !employee.applications)
      return { items: [], lastSyncedAt: null, appSummary: {} };

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
        vendor: p.platform,
        category: "External Service",
        ax: {
          type: "external",
          access: access,
          lastUpdated: p.details?.last_synced_at || p.last_synced_at,
          connected: true,
        },
      };
    });

    const assignedApps = (employee.applications || []).map((app) => ({
      appId: app.name.toLowerCase().replace(/\s/g, "-"),
      appName: app.name,
      vendor: "Manual Assignment",
      category: app.category,
      ax: {
        type: app.type.toLowerCase(),
        access: "Granted",
        lastUpdated: app.updated_at,
        connected: false,
      },
    }));

    const allItems = [...connectedApps, ...assignedApps];

    const latestSync = (platformStatuses || []).reduce((latest, p) => {
      const currentSync = p.details?.last_synced_at || p.last_synced_at;
      if (!currentSync) return latest;
      return new Date(currentSync) > new Date(latest || 0)
        ? currentSync
        : latest;
    }, null);

    const summary = {
      total: allItems.length,
      internal: allItems.filter((a) => a.ax.type === "internal").length,
      external: allItems.filter((a) => a.ax.type === "external").length,
      active: allItems.filter((a) => a.ax.access === "Active").length,
      suspended: allItems.filter((a) => a.ax.access === "Suspended").length,
      granted: allItems.filter((a) => a.ax.access === "Granted").length,
      notfound: allItems.filter((a) => a.ax.access === "Not found").length,
    };

    return { items: allItems, lastSyncedAt: latestSync, appSummary: summary };
  }, [platformStatuses, employee.applications]);

  const [q, setQ] = useState("");
  const [segment, setSegment] = useState("All");

  const filteredApps = useMemo(() => {
    const seg = segment.toLowerCase();
    return items.filter((a) => {
      const matchesSegment = seg === "all" ? true : a.ax.type === seg;
      const matchesSearch =
        !q.trim() ||
        [a.appName, a.vendor, a.category]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase());
      return matchesSegment && matchesSearch;
    });
  }, [items, q, segment]);

  const { licensesWithCost, licSummary } = useMemo(() => {
    if (!assignments || !allLicenseData)
      return { licensesWithCost: [], licSummary: {} };

    const licenseCostMap = new Map(
      allLicenseData.map((lic) => [lic.name, lic])
    );

    const licensesWithCost = assignments.map((asgn) => {
      const costData = licenseCostMap.get(asgn.application_name) || {};
      const unitPrice = parseFloat(costData.cost_per_seat_monthly) || 0;
      return {
        id: asgn.assignment_id,
        product: asgn.application_name,
        plan: costData.license_tier || "Standard",
        billing: unitPrice > 0 ? "Monthly" : "Free",
        unitPrice: unitPrice,
      };
    });

    const monthly = licensesWithCost.reduce((sum, l) => sum + l.unitPrice, 0);
    return {
      licensesWithCost,
      licSummary: {
        total: licensesWithCost.length,
        paid: licensesWithCost.filter((l) => l.unitPrice > 0).length,
        free: licensesWithCost.filter((l) => l.unitPrice === 0).length,
        monthly: monthly,
        annualized: monthly * 12,
      },
    };
  }, [assignments, allLicenseData]);

  if (isLoadingPlatforms || isLoadingAssignments || isLoadingAllLicenses) {
    return <EmployeeListSkeleton count={5} />;
  }

  return (
    <>
      <div className="bg-neutral-50 dark:bg-gray-800 text-neutral-900 dark:text-neutral-100 -m-6 p-6">
        <header className="mb-4">
          <div className="mt-4">
            <SegmentedControl
              value={mainTab}
              onChange={setMainTab}
              options={["Applications", "Licenses"]}
            />
          </div>
        </header>

        {mainTab === "Applications" ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-5">
              <SummaryChip
                icon={<Grid2X2 className="h-4 w-4" />}
                label="Total"
                value={appSummary.total}
              />
              <SummaryChip
                icon={<Shield className="h-4 w-4" />}
                label="Internal"
                value={appSummary.internal}
              />
              <SummaryChip
                icon={<Cpu className="h-4 w-4" />}
                label="External"
                value={appSummary.external}
              />
              <SummaryChip
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Active"
                value={appSummary.active}
              />
              <SummaryChip
                icon={<CircleAlert className="h-4 w-4" />}
                label="Suspended"
                value={appSummary.suspended}
              />
              <SummaryChip
                icon={<BadgeCheck className="h-4 w-4" />}
                label="Granted"
                value={appSummary.granted}
              />
              <SummaryChip
                icon={<X className="h-4 w-4" />}
                label="Not found"
                value={appSummary.notfound}
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
              <SegmentedControl
                value={segment}
                onChange={setSegment}
                options={["All", "External", "Internal"]}
              />
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-neutral-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search applications..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-kredivo-primary"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="hidden md:grid grid-cols-12 bg-neutral-100 dark:bg-neutral-900 text-sm px-4 py-3 font-semibold">
                <div className="col-span-5">Application</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Access</div>
                <div className="col-span-2">Last updated</div>
                <div className="col-span-1 text-right"></div>
              </div>
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredApps.map((app) => (
                  <li
                    key={app.appId}
                    className="block md:grid md:grid-cols-12 items-center px-4 py-3"
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      <AppAvatar name={app.appName} />
                      <div>
                        <div className="font-medium">{app.appName}</div>
                        <div className="text-xs text-neutral-500">
                          {app.category}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 mt-2 md:mt-0">
                      <span className="md:hidden text-xs font-bold mr-2">
                        Type:
                      </span>
                      <span className="text-xs">{app.ax.type}</span>
                    </div>
                    <div className="col-span-2 mt-2 md:mt-0">
                      <span className="md:hidden text-xs font-bold mr-2">
                        Access:
                      </span>
                      <AccessStatusBadge access={app.ax.access} />
                    </div>
                    <div className="col-span-2 mt-2 md:mt-0">
                      <span className="md:hidden text-xs font-bold mr-2">
                        Updated:
                      </span>
                      <span className="text-sm text-neutral-500">
                        {app.ax.lastUpdated
                          ? formatTimeAgo(app.ax.lastUpdated)
                          : "—"}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-start md:justify-end mt-2 md:mt-0">
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
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-5">
              <SummaryChip
                icon={<Receipt className="h-4 w-4" />}
                label="Total"
                value={licSummary.total}
              />
              <SummaryChip
                icon={<DollarSign className="h-4 w-4" />}
                label="Monthly"
                value={`$${licSummary.monthly?.toFixed(2)}`}
              />
              <SummaryChip
                icon={<Calendar className="h-4 w-4" />}
                label="Annualized"
                value={`$${licSummary.annualized?.toFixed(2)}`}
              />
              <SummaryChip
                icon={<BadgeCheck className="h-4 w-4" />}
                label="Paid"
                value={licSummary.paid}
              />
              <SummaryChip
                icon={<Shield className="h-4 w-4" />}
                label="Free"
                value={licSummary.free}
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="grid grid-cols-12 bg-neutral-100 dark:bg-neutral-900 text-sm px-4 py-3 font-semibold">
                <div className="col-span-5">License</div>
                <div className="col-span-3">Plan</div>
                <div className="col-span-2">Billing</div>
                <div className="col-span-2">Price/mo</div>
              </div>
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {licensesWithCost.map((l) => (
                  <li
                    key={l.id}
                    className="grid grid-cols-12 items-center px-4 py-3"
                  >
                    <div className="col-span-5 font-medium">{l.product}</div>
                    <div className="col-span-3 text-sm">{l.plan}</div>
                    <div className="col-span-2 text-sm capitalize">
                      {l.billing}
                    </div>
                    <div className="col-span-2 text-sm">
                      {l.unitPrice > 0 ? `$${l.unitPrice.toFixed(2)}` : "Free"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      <Drawer
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title={`${selectedApp?.appName} Access Details`}
      >
        {selectedApp && (
          <AppDetailsDrawerContent
            app={selectedApp}
            employeeId={employee.id}
            platformStatus={platformStatuses.find(
              (p) => p.platform === selectedApp.appName
            )}
          />
        )}
      </Drawer>
    </>
  );
};
