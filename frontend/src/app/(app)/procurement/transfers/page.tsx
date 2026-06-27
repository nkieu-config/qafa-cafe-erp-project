"use client";

import { StockTransfersPanel } from "@/components/inventory/StockTransfersPanel";
import { HubCard } from "@/components/shared/hub-card";
import { ArrowRightLeft } from "lucide-react";

export default function TransfersPage() {
  return (
    <HubCard
      title="Stock Transfers"
      icon={ArrowRightLeft}
      description="Request and accept stock transfers between branches."
    >
      <StockTransfersPanel mode="full" />
    </HubCard>
  );
}
