import React from "react";
import { CheckCircle2, CircleAlert, BadgeCheck, X } from "lucide-react";

export const AccessStatusBadge = ({ access }) => {
  const statusMap = {
    Active: {
      label: "Active",
      className:
        "border-emerald-200 text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-300",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    Suspended: {
      label: "Suspended",
      className:
        "border-amber-200 text-amber-700 dark:border-amber-900/50 dark:text-amber-300",
      icon: <CircleAlert className="h-3 w-3" />,
    },
    Granted: {
      label: "Granted",
      className:
        "border-blue-200 text-blue-700 dark:border-blue-900/50 dark:text-blue-300",
      icon: <BadgeCheck className="h-3 w-3" />,
    },
    "Not found": {
      label: "Not found",
      className:
        "border-rose-200 text-rose-700 dark:border-rose-900/50 dark:text-rose-300",
      icon: <X className="h-3 w-3" />,
    },
  };

  const status = statusMap[access] || statusMap["Granted"];

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${status.className}`}
    >
      {status.icon}
      {status.label}
    </span>
  );
};
