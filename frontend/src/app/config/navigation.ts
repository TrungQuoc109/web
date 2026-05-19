import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Settings,
  SquareCheckBig,
  Users,
} from "lucide-react";

type NavigationItem = {
  labelKey: string;
  to: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

export const navigationItems: NavigationItem[] = [
  {
    labelKey: "nav.dashboard",
    to: "/",
    icon: LayoutDashboard,
    end: true,
  },
  {
    labelKey: "nav.projects",
    to: "/projects",
    icon: FolderKanban,
  },
  {
    labelKey: "nav.tasks",
    to: "/tasks",
    icon: SquareCheckBig,
  },
  {
    labelKey: "nav.members",
    to: "/members",
    icon: Users,
  },
  {
    labelKey: "nav.messages",
    to: "/messages",
    icon: MessageSquare,
  },
  {
    labelKey: "nav.notifications",
    to: "/notifications",
    icon: Bell,
  },
  {
    labelKey: "nav.settings",
    to: "/settings",
    icon: Settings,
  },
] as const;
