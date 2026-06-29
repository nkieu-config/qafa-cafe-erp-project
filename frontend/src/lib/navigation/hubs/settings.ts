import { Settings, History } from "lucide-react";
import type { HubConfig } from "../types";

export const settingsHub: HubConfig = {
  id: "settings",
  label: "Settings",
  description: "Global settings and audit logs for the ERP.",
  icon: Settings,
  basePath: "/settings",
  wrapAntd: false,
  tabs: [
    { id: "general", label: "General", path: "/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
    { id: "audit", label: "Audit Trail", path: "/settings/audit", icon: History, roles: ["SUPER_ADMIN"] },
  ],
};
