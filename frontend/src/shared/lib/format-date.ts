const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

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

  return date.toLocaleDateString();
}

export function formatCalendarDate(value: string) {
  if (!value) return "";

  const date = parseDate(value);
  if (!date) {
    return value;
  }

  return date.toLocaleDateString();
}

export function formatProjectUpdatedAt(value: string) {
  if (!value) return "";
  if (value.startsWith("Updated ")) {
    return value;
  }

  return `Updated ${formatRelativeDate(value)}`;
}
