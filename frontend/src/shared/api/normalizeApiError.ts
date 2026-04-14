import axios from "axios";

type NestErrorBody = {
  message?: unknown;
  error?: unknown;
  statusCode?: unknown;
};

export type NormalizedApiError = {
  message: string;
  statusCode?: number;
  error?: string;
  isAxiosError: boolean;
  isNetworkError: boolean;
  isUnauthorized: boolean;
};

function getMessageFromBody(data: unknown) {
  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const body = data as NestErrorBody;

  if (typeof body.message === "string" && body.message.trim()) {
    return body.message.trim();
  }

  if (Array.isArray(body.message)) {
    const firstMessage = body.message.find(
      (item): item is string => typeof item === "string" && item.trim().length > 0
    );

    if (firstMessage) {
      return firstMessage.trim();
    }
  }

  if (typeof body.error === "string" && body.error.trim()) {
    return body.error.trim();
  }

  return null;
}

function getStatusCode(data: unknown) {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const statusCode = (data as NestErrorBody).statusCode;
  return typeof statusCode === "number" ? statusCode : undefined;
}

function getErrorName(data: unknown) {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const error = (data as NestErrorBody).error;
  return typeof error === "string" && error.trim() ? error.trim() : undefined;
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (!axios.isAxiosError(error)) {
    return {
      message: "Something went wrong. Please try again.",
      isAxiosError: false,
      isNetworkError: false,
      isUnauthorized: false,
    };
  }

  const statusCode = error.response?.status;
  const responseBody = error.response?.data;
  const message =
    getMessageFromBody(responseBody) ||
    error.message ||
    "Request failed. Please try again.";

  return {
    message,
    statusCode: statusCode ?? getStatusCode(responseBody),
    error: getErrorName(responseBody),
    isAxiosError: true,
    isNetworkError: !error.response,
    isUnauthorized: statusCode === 401,
  };
}
