import { Landmark, Wallet, BookOpen } from "lucide-react";
import type { HubConfig } from "../types";

export const financeHub: HubConfig = {
  id: "finance",
  label: "Finance",
  description: "Manage HQ finances, ledger, and accounts.",
  icon: Landmark,
  basePath: "/finance",
  wrapAntd: true,
  tabs: [
    {
      id: "overview",
      label: "Overview",
      path: "/finance/overview",
      icon: Wallet,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
    {
      id: "ledger",
      label: "General Ledger",
      path: "/finance/ledger",
      icon: BookOpen,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
    {
      id: "accounts",
      label: "Chart of Accounts",
      path: "/finance/accounts",
      icon: Landmark,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
  ],
};
