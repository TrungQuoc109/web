import { cn } from "@/shared/lib/cn";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-2xl bg-secondary/70", className)} />;
}

