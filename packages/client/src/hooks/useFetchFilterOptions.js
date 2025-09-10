import { useState, useEffect } from "react";
import api from "../api/api";

export const useFetchFilterOptions = (endpoint) => {
  const [options, setOptions] = useState([]);
  useEffect(() => {
    if (!endpoint) return;
    const fetchOptions = async () => {
      try {
        const { data } = await api.get(`/${endpoint}`);
        if (data) setOptions(data);
      } catch (error) {
        console.error(`Failed to fetch filter options for ${endpoint}:`, error);
      }
    };
    fetchOptions();
  }, [endpoint]);
  return options;
};
