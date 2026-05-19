import { getCurrentLocale } from "@/i18n/languageStore";
import { getCurrentTranslation } from "@/i18n/useI18n";

function getRelativeTimeFormatter() {
  return new Intl.RelativeTimeFormat(getCurrentLocale(), {
    numeric: "auto",
  });
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelativeDate(value: string) {
  if (!value) return "";
  if (value.startsWith("Updated ")) {
    return value.replace(/^Updated\s+/, "");
  }

  const date = parseDate(value);
  if (!date) {
    return value;
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const absMinutes = Math.abs(diffMinutes);
  const relativeTimeFormatter = getRelativeTimeFormatter();

  if (absMinutes < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return relativeTimeFormatter.format(diffDays, "day");
  }

  return date.toLocaleDateString(getCurrentLocale());
}

export function formatCalendarDate(value: string) {
  if (!value) return "";

  const date = parseDate(value);
  if (!date) {
    return value;
  }

  return date.toLocaleDateString(getCurrentLocale());
}

export function formatProjectUpdatedAt(value: string) {
  if (!value) return "";
  if (value.startsWith("Updated ")) {
    return `${getCurrentTranslation("common.updated")} ${value.replace(/^Updated\s+/, "")}`;
  }

  return `${getCurrentTranslation("common.updated")} ${formatRelativeDate(value)}`;
}
