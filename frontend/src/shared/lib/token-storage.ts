const ACCESS_TOKEN_STORAGE_KEY = "pm.access-token";

function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return getStorage()?.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? null;
}

export function setAccessToken(token: string) {
  getStorage()?.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function removeAccessToken() {
  getStorage()?.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}
