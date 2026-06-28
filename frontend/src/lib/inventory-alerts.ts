import { stockLevel } from "@/lib/theme/stock";
import type { BranchInventory, InventoryBatch } from "@/types/api";

const DEFAULT_EXPIRY_WARNING_DAYS = 7;

/** Matches inventory balance page — stock at or below minimum (includes out of stock). */
export function isLowStockRecord(
  record: Pick<BranchInventory, "stock" | "minStock">,
): boolean {
  return stockLevel(record.stock, record.minStock) !== "ok";
}

export function countLowStockRecords(
  records: BranchInventory[] | null | undefined,
): number {
  return records?.filter(isLowStockRecord).length ?? 0;
}

/** Matches executive-summary / batches expiry window (7 days, qty > 0). */
export function isExpiringBatch(
  batch: Pick<InventoryBatch, "expiryDate" | "quantity" | "status">,
  warningDays = DEFAULT_EXPIRY_WARNING_DAYS,
): boolean {
  if (!batch.expiryDate || batch.quantity <= 0) return false;
  if (batch.status && !["ACTIVE", "EXPIRED"].includes(batch.status)) return false;

  const warningCutoff = new Date();
  warningCutoff.setDate(warningCutoff.getDate() + warningDays);
  warningCutoff.setHours(23, 59, 59, 999);

  return new Date(batch.expiryDate).getTime() <= warningCutoff.getTime();
}

export function countExpiringBatches(
  batches: InventoryBatch[] | null | undefined,
  warningDays = DEFAULT_EXPIRY_WARNING_DAYS,
): number {
  return batches?.filter((batch) => isExpiringBatch(batch, warningDays)).length ?? 0;
}
