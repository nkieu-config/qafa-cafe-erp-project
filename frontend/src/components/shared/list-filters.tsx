"use client";

import { type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formSelectContentClassName, listToolbarFieldClassName } from "@/lib/theme";
import { cn } from "@/lib/utils";

export type ListFilterOption<T extends string = string> = {
  value: T;
  label: string;
};

type ListFilterSelectProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly ListFilterOption<T>[];
  ariaLabel: string;
  placeholder?: string;
  triggerClassName?: string;
  /** Tailwind width classes for the trigger. Default: w-full sm:w-[180px] */
  widthClassName?: string;
};

/** Shadcn Select styled for ListToolbar filter rows. */
export function ListFilterSelect<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  placeholder,
  triggerClassName,
  widthClassName = "w-full sm:w-[180px]",
}: ListFilterSelectProps<T>) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next != null) onValueChange(next as T);
      }}
    >
      <SelectTrigger
        className={listToolbarFieldClassName(
          cn("min-h-[44px]", widthClassName, triggerClassName),
        )}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder ?? options[0]?.label} />
      </SelectTrigger>
      <SelectContent className={formSelectContentClassName()}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type ListFilterDateProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  min?: string;
  className?: string;
};

/** Date input styled for ListToolbar filter rows. */
export function ListFilterDate({
  value,
  onChange,
  ariaLabel,
  min,
  className,
}: ListFilterDateProps) {
  return (
    <Input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={listToolbarFieldClassName(cn("h-11 min-h-[44px]", className))}
      aria-label={ariaLabel}
      min={min}
    />
  );
}

type ListFilterRowProps = {
  children: ReactNode;
  className?: string;
};

/** Horizontal / stacked wrapper for multiple toolbar filters. */
export function ListFilterRow({ children, className }: ListFilterRowProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-2 w-full sm:w-auto", className)}>
      {children}
    </div>
  );
}

/** Build options with a leading "all" sentinel. */
export function withAllFilterOption<T extends string>(
  allValue: T,
  allLabel: string,
  items: readonly ListFilterOption<T>[],
): ListFilterOption<T>[] {
  return [{ value: allValue, label: allLabel }, ...items];
}
