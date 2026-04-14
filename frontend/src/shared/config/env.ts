const apiUrl = import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000";

export const env = Object.freeze({
  apiUrl,
});
