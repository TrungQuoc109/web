import { useQuery } from "@tanstack/react-query";

import {
  dashboardMock,
  emptyDashboardMock,
} from "@/dashboard/mock/dashboardMock";
import type { DashboardOverview } from "@/dashboard/types/dashboard";
import { mockDelay } from "@/shared/api/mockDelay";

export function useDashboardOverview() {
  return useQuery<DashboardOverview>({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      await mockDelay(450);

      return import.meta.env.VITE_DASHBOARD_EMPTY === "1"
        ? emptyDashboardMock
        : dashboardMock;
    },
    staleTime: Infinity,
  });
}
