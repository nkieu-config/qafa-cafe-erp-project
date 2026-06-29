import { ChefHat, ListTree } from "lucide-react";
import type { HubConfig } from "../types";

export const kitchenHub: HubConfig = {
  id: "kitchen",
  label: "Central Kitchen",
  description: "Manage production orders and production BOMs.",
  icon: ChefHat,
  basePath: "/kitchen",
  wrapAntd: true,
  tabs: [
    {
      id: "production",
      label: "Production Orders",
      path: "/kitchen",
      icon: ChefHat,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
    {
      id: "boms",
      label: "Production BOM",
      path: "/kitchen/boms",
      icon: ListTree,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
  ],
};
