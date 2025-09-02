import { format, formatDistanceToNow } from "date-fns";
// MODIFICATION: Import the new function for timezone formatting
import { formatInTimeZone } from "date-fns-tz";

/**
 * Formats a date string or timestamp into a full date and time in the Asia/Jakarta timezone.
 * e.g., "July 18, 2025, 9:45 AM"
 * @param {string | number | Date} dateInput - The date to format (assumed to be UTC).
 * @returns {string} - The formatted date string or 'N/A'.
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return "N/A";
  try {
    // MODIFICATION: Use formatInTimeZone to convert the stored UTC time to GMT+7 for display.
    return formatInTimeZone(
      new Date(dateInput),
      "Asia/Jakarta", // The target timezone
      "MMMM d, yyyy, h:mm a" // The desired output format
    );
  } catch (error) {
    return "Invalid Date";
  }
};

/**
 * Formats a date string or timestamp into just the date part.
 * Timezone conversion is less critical here, but we can use it for consistency.
 * e.g., "July 18, 2025"
 * @param {string | number | Date} dateInput - The date to format.
 * @returns {string} - The formatted date string or 'N/A'.
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return "N/A";
  try {
    return formatInTimeZone(
      new Date(dateInput),
      "Asia/Jakarta",
      "MMMM d, yyyy"
    );
  } catch (error) {
    return "Invalid Date";
  }
};

/**
 * Formats a date string or timestamp into a relative "time ago" string.
 * This function does not need timezone conversion as it's relative.
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
