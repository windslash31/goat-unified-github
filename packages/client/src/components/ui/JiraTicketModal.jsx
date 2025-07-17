import React, { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Portal } from "./Portal";
import { X, ExternalLink, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "./Button";
import { motion, AnimatePresence } from "framer-motion";
import { JIRA_ISSUE_TYPE_MAPPERS } from "../../config/jiraFieldMapping";

// The fetch function remains the same.
const fetchTicketDetails = async (ticketId, token) => {
  if (!ticketId || !token) return null;
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/api/jira/ticket/${ticketId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to fetch Jira ticket details.");
  }
  return response.json();
};

const DetailRow = ({ label, value, type, isMono }) => {
  if (value === null || typeof value === "undefined" || value === "")
    return null;
  let displayValue = value;
  if (type === "date" && value) {
    displayValue = new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2.5 px-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
        {label}
      </dt>
      <dd
        className={`text-sm text-gray-800 dark:text-gray-200 sm:col-span-2 break-words ${
          isMono ? "font-mono text-xs" : ""
        }`}
      >
        {String(displayValue)}
      </dd>
    </div>
  );
};

const SectionHeader = ({ children }) => (
  <h4 className="text-md font-semibold text-gray-600 dark:text-gray-300 pt-4 pb-1 border-b-2 border-kredivo-primary/50">
    {children}
  </h4>
);

// --- START: NEW ASSET DETAILS COMPONENT ---
const AssetDetails = ({ asset }) => {
  // If there's an error message in the asset details, display it.
  if (asset.error) {
    return (
      <div>
        <SectionHeader>Asset Details</SectionHeader>
        <div className="text-red-500 text-sm py-2">{asset.error}</div>
      </div>
    );
  }

  // Filter out null or undefined values before rendering
  const detailsToShow = Object.entries(asset).filter(
    ([key, value]) => value !== null && typeof value !== "undefined"
  );

  if (detailsToShow.length === 0) {
    return null; // Don't render the section if there are no asset details
  }

  return (
    <div>
      <SectionHeader>Asset Details</SectionHeader>
      {detailsToShow.map(([key, value]) => (
        <DetailRow key={key} label={key.replace(/_/g, " ")} value={value} />
      ))}
    </div>
  );
};
// --- END: NEW ASSET DETAILS COMPONENT ---

export const JiraTicketModal = ({ ticketId, onClose }) => {
  const token = localStorage.getItem("accessToken");

  const {
    data: ticket,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["jiraTicket", ticketId],
    queryFn: () => fetchTicketDetails(ticketId, token),
    enabled: !!ticketId && !!token,
  });

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  const processedDetails = useMemo(() => {
    if (!ticket) return null;
    const mapper = JIRA_ISSUE_TYPE_MAPPERS[ticket.issueType];
    return mapper
      ? mapper(ticket)
      : { title: "General Ticket Details", sections: [] };
  }, [ticket]);

  const jiraBaseUrl =
    import.meta.env.VITE_JIRA_BASE_URL ||
    `https://${import.meta.env.VITE_ATLASSIAN_DOMAIN}/browse/`;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader className="w-8 h-8 animate-spin text-kredivo-primary" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center h-48 flex flex-col justify-center items-center text-red-500">
          <p>Could not load ticket details.</p>
          <p className="text-xs">{error.message}</p>
        </div>
      );
    }
    if (ticket) {
      return (
        <div className="space-y-4">
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {ticket.summary}
          </p>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            {ticket.issueType}
          </span>

          <dl className="space-y-1">
            <SectionHeader>Standard Details</SectionHeader>
            <DetailRow label="Status" value={ticket.status} />
            <DetailRow label="Assignee" value={ticket.assignee} />
            <DetailRow label="Reporter" value={ticket.reporter} />
            <DetailRow
              label="Created"
              value={new Date(ticket.created).toLocaleString()}
            />

            {processedDetails?.sections.map((section) => (
              <div key={section.title}>
                <SectionHeader>{section.title}</SectionHeader>
                {section.fields.map((field) => (
                  <DetailRow key={field.label} {...field} />
                ))}
              </div>
            ))}

            {/* --- START: RENDER ASSET DETAILS --- */}
            {ticket.asset_details &&
              Object.keys(ticket.asset_details).length > 0 && (
                <AssetDetails asset={ticket.asset_details} />
              )}
            {/* --- END: RENDER ASSET DETAILS --- */}
          </dl>
        </div>
      );
    }
    return (
      <div className="text-center text-gray-500 p-8">
        Ticket data could not be found.
      </div>
    );
  };

  return (
    <Portal>
      <AnimatePresence>
        {ticketId && (
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
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                <h3 className="text-lg font-semibold">
                  Jira Ticket: {ticketId}
                </h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">{renderContent()}</div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex justify-end flex-shrink-0">
                <a
                  href={`${jiraBaseUrl}${ticketId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="primary">
                    <ExternalLink className="w-4 h-4 mr-2" /> Open in Jira
                  </Button>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};
