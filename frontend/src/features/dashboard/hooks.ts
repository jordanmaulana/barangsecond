import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { DashboardStats } from "@/features/dashboard/types";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api<DashboardStats>("/dashboard/stats/"),
  });
}
