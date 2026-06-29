import { Building2, ShieldCheck } from "lucide-react";
import type { HubConfig } from "../types";

export const organizationHub: HubConfig = {
  id: "organization",
  label: "Organization",
  description: "Manage branches, locations, and user access.",
  icon: Building2,
  basePath: "/organization",
  wrapAntd: true,
  tabs: [
    {
      id: "branches",
      label: "Branches",
      path: "/organization/branches",
      icon: Building2,
      roles: ["SUPER_ADMIN"],
    },
    {
      id: "users",
      label: "Users & Roles",
      path: "/organization/users",
      icon: ShieldCheck,
      roles: ["SUPER_ADMIN"],
    },
  ],
};
