import { cn } from "@/shared/lib/cn";

type ProjectTab = {
  id: string;
  label: string;
};

type ProjectTabsProps = {
  items: ProjectTab[];
  activeTab: string;
  onChange: (tabId: string) => void;
};

export function ProjectTabs({
  items,
  activeTab,
  onChange,
}: ProjectTabsProps) {
  return (
    <div className="rounded-2xl border border-border bg-background/95 p-1 shadow-sm">
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors",
              activeTab === item.id && "bg-secondary text-foreground"
            )}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

