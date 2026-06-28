import { useQueryClient } from "@tanstack/react-query";
import { NAV_COUNTS_QUERY_KEY } from "@/lib/nav-counts";

export function useInvalidateNavCounts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
}
