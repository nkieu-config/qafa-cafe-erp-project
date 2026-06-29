import {
  Package,
  PackageOpen,
  ClipboardCheck,
  ArrowDownToLine,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import type { HubConfig } from "../types";

export const inventoryHub: HubConfig = {
  id: "inventory",
  label: "Inventory",
  description: "Manage stock levels, batches, receipts, transfers, and waste.",
  icon: Package,
  basePath: "/inventory",
  wrapAntd: true,
  tabs: [
    {
      id: "balance",
      label: "Overview",
      path: "/inventory",
      icon: PackageOpen,
      roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
    },
    {
      id: "batches",
      label: "Batches & Expiry",
      path: "/inventory/batches",
      icon: ClipboardCheck,
      roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
    },
    {
      id: "grn",
      label: "Receive Stock (GRN)",
      path: "/inventory/stock-in",
      icon: ArrowDownToLine,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
    {
      id: "transfers",
      label: "Stock Transfers",
      path: "/inventory/transfers",
      icon: ArrowRightLeft,
      roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
    },
    {
      id: "waste",
      label: "Waste Logs",
      path: "/inventory/waste",
      icon: Trash2,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
  ],
};
