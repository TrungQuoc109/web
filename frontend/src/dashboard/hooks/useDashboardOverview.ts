import { useQuery } from "@tanstack/react-query";

import { dashboardApi } from "@/dashboard/api/dashboardApi";
import type { DashboardOverview } from "@/dashboard/types/dashboard";
import { dashboardKeys } from "@/shared/lib/query-keys";

export function useDashboardOverview() {
  return useQuery<DashboardOverview>({
    queryKey: dashboardKeys.overview(),
    queryFn: () => dashboardApi.getOverview(),
    staleTime: 30_000,
  });
}
