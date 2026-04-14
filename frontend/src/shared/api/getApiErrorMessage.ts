import { normalizeApiError } from "@/shared/api/normalizeApiError";

export function getApiErrorMessage(error: unknown) {
  return normalizeApiError(error).message;
}
