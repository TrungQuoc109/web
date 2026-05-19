import { cn } from "@/shared/lib/cn";

type AvatarProps = {
  name?: string | null;
  email?: string | null;
  className?: string;
};

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "PM";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, email, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold text-secondary-foreground",
        className
      )}
      aria-label={name || email || "User avatar"}
    >
      {getInitials(name, email)}
    </div>
  );
}

