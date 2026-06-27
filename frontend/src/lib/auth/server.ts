import "server-only";

import { cache } from "react";
import { serverFetchAPI } from "@/lib/api/server";
import { API_ENDPOINTS } from "@/lib/endpoints";
import type { SessionUser } from "@/types/auth";

export const getSession = cache(async (): Promise<SessionUser | null> => {
  return serverFetchAPI<SessionUser>(API_ENDPOINTS.auth.me);
});
