import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "./useDebounce";
import api from "../api/api";

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
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    jobTitle: "",
    manager: "",
    legal_entity_id: "",
    office_location_id: "",
    employee_type_id: "",
    employee_sub_type_id: "",
    application_id: "",
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
  });

  const [sorting, setSorting] = useState({
    sortBy: "first_name",
    sortOrder: "asc",
  });

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

  const filtersString = JSON.stringify(filters);
  const sortingString = JSON.stringify(sorting);

  useEffect(() => {
    // This effect now only runs when the *content* of filters or sorting changes.
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
