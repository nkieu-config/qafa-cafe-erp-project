import { ShoppingCart, Receipt, Wallet } from "lucide-react";
import type { HubConfig } from "../types";

export const posHub: HubConfig = {
  id: "pos",
  label: "Point of Sale",
  description: "Process sales and manage cash register.",
  icon: ShoppingCart,
  basePath: "/pos",
  wrapAntd: false,
  tabs: [
    {
      id: "terminal",
      label: "Terminal",
      path: "/pos/terminal",
      icon: ShoppingCart,
      roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
    },
    {
      id: "orders",
      label: "Orders",
      path: "/pos/orders",
      icon: Receipt,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
    {
      id: "settlement",
      label: "Settlement",
      path: "/pos/settlement",
      icon: Wallet,
      roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
    },
  ],
};
