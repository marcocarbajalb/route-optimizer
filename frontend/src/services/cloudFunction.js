import axios from "axios";

// The deployed Cloud Function URL is injected at build time via Vite env.
const CLOUD_FUNCTION_URL = import.meta.env.VITE_CLOUD_FUNCTION_URL;

/**
 * Calls the optimization Cloud Function with the user's destinations.
 *
 * @param {Object} payload - { locations: [...], config: {...} }
 * @param {string} token - Firebase ID token for the authenticated user
 * @returns {Promise<Object>} The optimization result: { route: {...} }
 * @throws {Error} With a user-facing message extracted from the backend
 */
export async function optimizeRoute(payload, token) {
  if (!CLOUD_FUNCTION_URL) {
    throw new Error(
      "Cloud Function URL is not configured. Set VITE_CLOUD_FUNCTION_URL."
    );
  }

  try {
    const response = await axios.post(CLOUD_FUNCTION_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Normalizes backend and network errors into a single user-facing message.
 * The Cloud Function returns errors as { "error": "..." }.
 */
function extractErrorMessage(error) {
  const data = error.response?.data;

  if (data?.error) {
    // Strip the Pydantic "Value error, " prefix if present, so validation
    // messages (2-15 destinations, 100km radius) read cleanly.
    return data.error.replace("Value error, ", "");
  }

  if (error.response?.status === 403) {
    return "Access denied: this IP address is not allowed to call the service.";
  }

  if (error.response?.status === 401) {
    return "Authentication failed. Please sign in again.";
  }

  return "An error occurred while connecting to the optimization service.";
}