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
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    to: "/",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Projects",
    to: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Tasks",
    to: "/tasks",
    icon: SquareCheckBig,
  },
  {
    label: "Members",
    to: "/members",
    icon: Users,
  },
  {
    label: "Messages",
    to: "/messages",
    icon: MessageSquare,
  },
  {
    label: "Notifications",
    to: "/notifications",
    icon: Bell,
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
  },
] as const;
