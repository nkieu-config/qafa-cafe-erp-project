import type { HubConfig, HubId } from "../types";
import { inventoryHub } from "./inventory";
import { procurementHub } from "./procurement";
import { hrHub } from "./hr";
import { productsHub } from "./products";
import { kitchenHub } from "./kitchen";
import { crmHub } from "./crm";
import { financeHub } from "./finance";
import { assetsHub } from "./assets";
import { posHub } from "./pos";
import { settingsHub } from "./settings";
import { organizationHub } from "./organization";

export const HUBS: Record<HubId, HubConfig> = {
  inventory: inventoryHub,
  procurement: procurementHub,
  hr: hrHub,
  products: productsHub,
  kitchen: kitchenHub,
  crm: crmHub,
  finance: financeHub,
  assets: assetsHub,
  pos: posHub,
  settings: settingsHub,
  organization: organizationHub,
};

export {
  inventoryHub,
  procurementHub,
  hrHub,
  productsHub,
  kitchenHub,
  crmHub,
  financeHub,
  assetsHub,
  posHub,
  settingsHub,
  organizationHub,
};
