import { Wrench } from "lucide-react";
import type { HubConfig } from "../types";

export const assetsHub: HubConfig = {
  id: "assets",
  label: "Assets",
  description: "Register equipment and track maintenance for store assets.",
  icon: Wrench,
  basePath: "/assets",
  wrapAntd: true,
  tabs: [
    {
      id: "equipment",
      label: "Equipment",
      path: "/assets",
      icon: Wrench,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
  ],
};
