import { ClipboardList, Leaf, SlidersHorizontal, BarChart3 } from "lucide-react";
import type { HubConfig } from "../types";

export const productsHub: HubConfig = {
  id: "products",
  label: "Products",
  description: "Manage menu catalog, ingredients, modifiers, and food cost.",
  icon: ClipboardList,
  basePath: "/products",
  wrapAntd: true,
  tabs: [
    {
      id: "menu",
      label: "Menu Items",
      path: "/products",
      icon: ClipboardList,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
    {
      id: "ingredients",
      label: "Raw Ingredients",
      path: "/products/ingredients",
      icon: Leaf,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
    {
      id: "modifiers",
      label: "Modifiers",
      path: "/products/modifiers",
      icon: SlidersHorizontal,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
    {
      id: "costing",
      label: "Food Cost",
      path: "/products/costing",
      icon: BarChart3,
      roles: ["SUPER_ADMIN", "MANAGER"],
    },
  ],
};
