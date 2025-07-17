import React, { memo, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserSquare,
  UserCog,
  ChevronsUp,
  Building2,
  Layers,
  MapPin,
  Hash,
  Calendar,
  Ticket,
  Laptop,
  Loader,
} from "lucide-react";
import { DetailRow } from "../../components/ui/DetailRow";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import api from "../../api/api";
import toast from "react-hot-toast";

const AssetButton = ({ employee, onAssetClick }) => {
  const [isAssetLoading, setIsAssetLoading] = useState(false);

  const handleAssetClick = async () => {
    const assetName = employee.asset_name;
    if (!assetName) {
      toast.error("No asset name found for this employee.");
      return;
    }

    setIsAssetLoading(true);
    try {
      const { data: assetDetails } = await api.get(
        `/api/jira/asset/search?name=${encodeURIComponent(assetName)}`
      );

      if (assetDetails && Object.keys(assetDetails).length > 0) {
        onAssetClick(assetDetails);
      } else {
        toast.error(`No details found for asset: ${assetName}`);
      }
    } catch (error) {
      console.error("Failed to fetch asset details:", error);
      toast.error(error.message || `Could not load details for ${assetName}.`);
    } finally {
      setIsAssetLoading(false);
    }
  };

  if (!employee.asset_name) {
    return "—";
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAssetClick}
      disabled={isAssetLoading}
      className="flex items-center gap-2 text-left"
    >
      {isAssetLoading ? (
        <Loader size={16} className="animate-spin" />
      ) : (
        <Laptop size={16} />
      )}
      {employee.asset_name}
    </Button>
  );
};

export const EmployeeDetailsTab = memo(
  ({ employee, permissions, navigate, onTicketClick, onAssetClick }) => {
    const formatDate = (dateString) => {
      if (!dateString) return "—";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const JiraTicketLink = ({ ticketId }) => {
      if (!ticketId) return "—";
      return (
        <button
          onClick={() => onTicketClick(ticketId)}
          className="text-kredivo-primary hover:text-kredivo-primary-hover hover:underline font-mono flex items-center gap-1 text-right"
        >
          <Ticket className="w-4 h-4" />
          {ticketId}
        </button>
      );
    };

    const ManagerLink = ({ managerId, managerName, managerEmail }) => {
      if (!managerId) return "—";

      if (permissions.includes("employee:read:all")) {
        return (
          <Link
            to={`/employees/${managerId}`}
            className="text-kredivo-primary hover:text-kredivo-primary-hover hover:underline text-right"
          >
            <div>{managerName}</div>
            <div className="text-xs text-gray-400">{managerEmail}</div>
          </Link>
        );
      }

      return (
        <div className="text-right">
          <div>{managerName}</div>
          <div className="text-xs text-gray-400">{managerEmail}</div>
        </div>
      );
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Identity & Role
            </h4>
            <DetailRow
              icon={<UserSquare className="w-4 h-4 mr-2.5 text-gray-400" />}
              label="Email"
              value={employee.employee_email}
            />
            <DetailRow
              icon={<UserCog className="w-4 h-4 mr-2.5 text-gray-400" />}
              label="Manager"
              value={
                <ManagerLink
                  managerId={employee.manager_id}
                  managerName={employee.manager_name}
                  managerEmail={employee.manager_email}
                />
              }
            />
            <DetailRow
              icon={<ChevronsUp className="w-4 h-4 mr-2.5 text-gray-400" />}
              label="Position Level"
              value={employee.position_level}
            />
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Employment Details
            </h4>
            <DetailRow
              icon={<Layers className="w-4 h-4 mr-2.5 text-gray-400" />}
              label="Employment Status"
              value={<StatusBadge status={employee.status} />}
            />
            <DetailRow
              icon={<Building2 className="w-4 h-4 mr-2.5 text-gray-400" />}
              label="Legal Entity"
              value={employee.legal_entity}
            />
            <DetailRow
              icon={<Layers className="w-4 h-4 mr-2.5 text-gray-400" />}
              label="Employee Type"
              value={
                employee.employee_type && employee.employee_sub_type
                  ? `${employee.employee_type} (${employee.employee_sub_type})`
                  : employee.employee_type || "—"
              }
            />
            <DetailRow
              icon={<MapPin className="w-4 h-4 mr-2.5 text-gray-400" />}
              label="Office Location"
              value={employee.office_location}
            />
            <DetailRow
              icon={<Hash className="w-4 h-4 mr-2.5 text-gray-400" />}
              label="Asset"
              value={
                <AssetButton employee={employee} onAssetClick={onAssetClick} />
              }
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Timeline
            </h4>
            <DetailRow
              icon={<Calendar className="w-4 h-4 mr-2.5 text-green-500" />}
              label="Join Date"
              value={formatDate(employee.join_date)}
            />
            <DetailRow
              icon={<Calendar className="w-4 h-4 mr-2.5 text-red-500" />}
              label="Exit Date"
              value={formatDate(employee.date_of_exit_at_date)}
            />
            <DetailRow
              icon={<Calendar className="w-4 h-4 mr-2.5 text-red-500" />}
              label="Access Cut-off"
              value={formatDate(employee.access_cut_off_date_at_date)}
            />
            <DetailRow
              icon={<Calendar className="w-4 h-4 mr-2.5 text-gray-400" />}
              label="Record Updated"
              value={formatDate(employee.updated_at)}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Related Tickets
            </h4>
            <DetailRow
              icon={<Ticket className="w-4 h-4 mr-2.5 text-kredivo-primary" />}
              label="Onboarding Ticket"
              value={<JiraTicketLink ticketId={employee.onboarding_ticket} />}
            />
            <DetailRow
              icon={<Ticket className="w-4 h-4 mr-2.5 text-kredivo-primary" />}
              label="Offboarding Ticket"
              value={<JiraTicketLink ticketId={employee.offboarding_ticket} />}
            />
          </div>
        </div>
      </div>
    );
  }
);
