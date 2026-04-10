import axios from "axios";

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return "Something went wrong. Please try again.";

  const data = error.response?.data as unknown;
  if (typeof data === "string" && data.trim()) return data;

  if (data && typeof data === "object") {
    const maybeMessage = (data as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    if (Array.isArray(maybeMessage) && maybeMessage.length) {
      const first = maybeMessage[0];
      if (typeof first === "string" && first.trim()) return first;
    }
  }

  return error.message || "Request failed. Please try again.";
}

