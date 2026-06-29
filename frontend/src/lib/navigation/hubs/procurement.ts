import { Truck, Store, FileCheck } from "lucide-react";
import type { HubConfig } from "../types";

export const procurementHub: HubConfig = {
  id: "procurement",
  label: "Procurement",
  description: "Manage suppliers and purchase orders.",
  icon: Truck,
  basePath: "/procurement",
  wrapAntd: true,
  tabs: [
    {
      id: "suppliers",
      label: "Suppliers",
      path: "/procurement/suppliers",
      icon: Store,
      roles: ["SUPER_ADMIN", "MANAGER"],
      order: { SUPER_ADMIN: 1, MANAGER: 1, STAFF: 99 },
    },
    {
      id: "orders",
      label: "Purchase Orders",
      path: "/procurement/orders",
      icon: FileCheck,
      roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      order: { SUPER_ADMIN: 2, MANAGER: 2, STAFF: 1 },
    },
  ],
};
