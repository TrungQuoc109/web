type NamedEntity = {
  name?: string | null;
  email?: string | null;
} | null | undefined;

export function getDisplayText(
  value: string | null | undefined,
  fallback: string
) {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

export function getDisplayName(entity: NamedEntity, fallback: string) {
  return entity?.name ?? entity?.email ?? fallback;
}
