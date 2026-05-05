import { LayoutGrid, Search } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  FilterDropdownChip,
  type FilterDropdownOption,
} from "@/shared/ui/filter-dropdown-chip";

type TaskFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  projectFilter?: {
    label: string;
    value: string;
    currentLabel: string;
    options: FilterDropdownOption[];
    onChange: (value: string) => void;
    defaultValue?: string;
  };
  statusFilter: {
    label: string;
    value: string;
    currentLabel: string;
    options: FilterDropdownOption[];
    onChange: (value: string) => void;
    defaultValue?: string;
  };
  priorityFilter: {
    label: string;
    value: string;
    currentLabel: string;
    options: FilterDropdownOption[];
    onChange: (value: string) => void;
    defaultValue?: string;
  };
  assigneeFilter: {
    label: string;
    value: string;
    currentLabel: string;
    options: FilterDropdownOption[];
    onChange: (value: string) => void;
    defaultValue?: string;
  };
  visibleCount: number;
  visibleLabel: string;
  viewLabel: string;
  page: number;
  totalPages: number;
  pageLabel: string;
  ofLabel: string;
  resetLabel: string;
  showReset: boolean;
  onReset: () => void;
};

function isActive(value: string, defaultValue = "ALL") {
  return value !== defaultValue;
}

export function TaskFilters({
  search,
  onSearchChange,
  searchPlaceholder,
  projectFilter,
  statusFilter,
  priorityFilter,
  assigneeFilter,
  visibleCount,
  visibleLabel,
  viewLabel,
  page,
  totalPages,
  pageLabel,
  ofLabel,
  resetLabel,
  showReset,
  onReset,
}: TaskFiltersProps) {
  return (
    <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {projectFilter ? (
            <FilterDropdownChip
              label={projectFilter.label}
              value={projectFilter.value}
              currentLabel={projectFilter.currentLabel}
              options={projectFilter.options}
              onChange={projectFilter.onChange}
              active={isActive(projectFilter.value, projectFilter.defaultValue)}
            />
          ) : null}
          <FilterDropdownChip
            label={statusFilter.label}
            value={statusFilter.value}
            currentLabel={statusFilter.currentLabel}
            options={statusFilter.options}
            onChange={statusFilter.onChange}
            active={isActive(statusFilter.value, statusFilter.defaultValue)}
          />
          <FilterDropdownChip
            label={priorityFilter.label}
            value={priorityFilter.value}
            currentLabel={priorityFilter.currentLabel}
            options={priorityFilter.options}
            onChange={priorityFilter.onChange}
            active={isActive(priorityFilter.value, priorityFilter.defaultValue)}
          />
          <FilterDropdownChip
            label={assigneeFilter.label}
            value={assigneeFilter.value}
            currentLabel={assigneeFilter.currentLabel}
            options={assigneeFilter.options}
            onChange={assigneeFilter.onChange}
            active={isActive(assigneeFilter.value, assigneeFilter.defaultValue)}
          />

          {showReset ? (
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              {resetLabel}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="px-3 py-1">
          {visibleCount} {visibleLabel}
        </Badge>
        <Badge variant="outline" className="gap-2 px-3 py-1">
          <LayoutGrid className="size-4" />
          {viewLabel}
        </Badge>
        <p className="text-sm text-muted-foreground">
          {pageLabel} {page} {ofLabel} {totalPages}
        </p>
      </div>
    </section>
  );
}
