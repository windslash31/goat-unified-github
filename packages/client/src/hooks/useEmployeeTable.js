import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/api";
import { useAuthStore } from "../stores/authStore";

const fetchEmployees = async (filters, pagination, sorting) => {
  const queryParams = new URLSearchParams({
    page: pagination.currentPage,
    limit: pagination.limit,
    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder,
  });

  for (const key in filters) {
    if (filters[key] && filters[key] !== "all") {
      queryParams.append(key, filters[key]);
    }
  }

  const { data } = await api.get(`/api/employees?${queryParams.toString()}`);
  return data;
};

export const useEmployeeTable = () => {
  const { user } = useAuthStore();
  const storageKey = `employeeTablePrefs_${user?.email}`;

  const getInitialState = (key, defaultValue) => {
    try {
      const savedPrefs = localStorage.getItem(storageKey);
      if (savedPrefs) {
        const parsedPrefs = JSON.parse(savedPrefs);
        return parsedPrefs[key] || defaultValue;
      }
    } catch (error) {
      console.error(
        "Failed to parse user preferences from localStorage",
        error
      );
    }
    return defaultValue;
  };

  const [filters, setFilters] = useState(() =>
    getInitialState("filters", {
      status: "all",
      search: "",
      jobTitle: "",
      manager: "",
      legal_entity_id: "",
      office_location_id: "",
      employee_type_id: "",
      employee_sub_type_id: "",
      application_id: "",
    })
  );

  const [pagination, setPagination] = useState(() =>
    getInitialState("pagination", {
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      limit: 20,
    })
  );

  const [sorting, setSorting] = useState(() =>
    getInitialState("sorting", {
      sortBy: "first_name",
      sortOrder: "asc",
    })
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["employees", filters, pagination.currentPage, sorting],
    queryFn: () => fetchEmployees(filters, pagination, sorting),
    keepPreviousData: true,
    onSuccess: (data) => {
      setPagination((prev) => ({
        ...prev,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
      }));
    },
  });

  useEffect(() => {
    try {
      const prefsToSave = {
        filters,
        pagination: { ...pagination, currentPage: 1 },
        sorting,
      };
      localStorage.setItem(storageKey, JSON.stringify(prefsToSave));
    } catch (error) {
      console.error("Failed to save user preferences to localStorage", error);
    }
  }, [filters, pagination, sorting, storageKey]);

  const filtersString = JSON.stringify(filters);
  const sortingString = JSON.stringify(sorting);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [filtersString, sortingString]);

  return {
    employees: data?.employees || [],
    pagination,
    setPagination,
    sorting,
    setSorting,
    filters,
    setFilters,
    isLoading: isLoading || isFetching,
  };
};
