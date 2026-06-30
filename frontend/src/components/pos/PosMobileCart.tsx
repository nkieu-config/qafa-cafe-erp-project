"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { PosCartSidebar, type PosCartSidebarProps } from "@/components/pos/PosCartSidebar";
import {
  posMobileCartBarClassName,
  posMobileCartButtonClassName,
  posMobileCartIconClassName,
  posMobileCartSheetClassName,
  posMobileCartTotalClassName,
  posPayActionClassName,
} from "@/lib/theme/immersive";
import { text } from "@/lib/theme/surface";
import { typeUiLabelClassName } from "@/lib/theme/typography";
import { cn } from "@/lib/utils";

export function PosMobileCart(props: PosCartSidebarProps) {
  const [open, setOpen] = useState(false);
  const itemCount = props.cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setOpen(false);
    props.onCheckout();
  };

  return (
    <>
      <div className={posMobileCartBarClassName()}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={posMobileCartButtonClassName()}
          aria-label={`View cart, ${itemCount} items, total ฿${props.netTotal.toLocaleString()}`}
        >
          <ShoppingBag className={posMobileCartIconClassName("h-4 w-4 shrink-0")} aria-hidden />
          <span className={cn(typeUiLabelClassName("text-sm"), text.secondary)}>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
          <span className={posMobileCartTotalClassName()}>
            ฿{props.netTotal.toLocaleString()}
          </span>
        </button>
        <Button
          className={posPayActionClassName("shrink-0 min-h-[44px] px-4")}
          disabled={props.cart.length === 0}
          onClick={handleCheckout}
        >
          Pay
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className={posMobileCartSheetClassName()}
          showCloseButton
        >
          <SheetTitle className="sr-only">Current order</SheetTitle>
          <PosCartSidebar
            {...props}
            onCheckout={handleCheckout}
            className="h-full rounded-none border-0 shadow-none"
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
