import { format, formatDistanceToNow } from "date-fns";

/**
 * Formats a date string or timestamp into a full date and time.
 * e.g., "July 18, 2025, 9:45 AM"
 * @param {string | number | Date} dateInput - The date to format.
 * @returns {string} - The formatted date string or 'N/A'.
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return "N/A";
  try {
    return format(new Date(dateInput), "MMMM d, yyyy, h:mm a");
  } catch (error) {
    return "Invalid Date";
  }
};

/**
 * Formats a date string or timestamp into just the date part.
 * e.g., "July 18, 2025"
 * @param {string | number | Date} dateInput - The date to format.
 * @returns {string} - The formatted date string or 'N/A'.
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return "N/A";
  try {
    return format(new Date(dateInput), "MMMM d, yyyy");
  } catch (error) {
    return "Invalid Date";
  }
};

/**
 * Formats a date string or timestamp into a relative "time ago" string.
 * e.g., "about 5 hours ago"
 * @param {string | number | Date} dateInput - The date to format.
 * @returns {string} - The relative time string or 'N/A'.
 */
export const formatTimeAgo = (dateInput) => {
  if (!dateInput) return "N/A";
  try {
    return formatDistanceToNow(new Date(dateInput), { addSuffix: true });
  } catch (error) {
    return "Invalid Date";
  }
};
