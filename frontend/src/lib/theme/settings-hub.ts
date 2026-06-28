import { cn } from "@/lib/utils";
import { elevatedPanelClassName } from "./surface";
import { hubCardIconClass } from "./hub-accent";

export function settingsSectionPanelClassName(className?: string) {
  return elevatedPanelClassName(cn("p-4 sm:p-6 space-y-4", className));
}

export function settingsHubIconClassName(className?: string) {
  return cn(hubCardIconClass("settings"), className);
}

export function settingsSheetContentClassName(className?: string) {
  return cn(
    "bg-[var(--table-container-bg)] text-foreground border-[var(--table-container-border)]",
    className,
  );
}
