import type { LucideIcon } from "lucide-react";
import { ChefHat, Package, ShoppingCart, Users } from "lucide-react";
import {
  authHeroCardClassName,
  authHeroModuleIconClassName,
  authHeroModuleGlyphClassName,
  authHeroModuleLabelClassName,
  authHeroStatClassName,
  authHeroStatLabelClassName,
  authHeroStatsGridClassName,
  authHeroStatValueClassName,
  authHeroTextClassName,
  authHeroTitleClassName,
} from "@/lib/theme/auth";
import { cn } from "@/lib/utils";

export const LOGIN_HERO_HEADLINE = "One platform for cafe operations";

export const LOGIN_HERO_BODY =
  "POS, multi-branch inventory, kitchen production, and payroll — try Admin, Manager, or Staff below.";

export const LOGIN_HERO_STATS = [
  { value: "11", label: "Modules" },
  { value: "3", label: "Demo roles" },
  { value: "340+", label: "Tests" },
] as const;

type HeroModule = {
  label: string;
  icon: LucideIcon;
};

const HERO_MODULES: HeroModule[] = [
  { label: "POS", icon: ShoppingCart },
  { label: "Inventory", icon: Package },
  { label: "HR", icon: Users },
  { label: "Kitchen", icon: ChefHat },
];

function HeroModuleIcons({ className }: { className?: string }) {
  return (
    <div className={cn("mb-6 grid grid-cols-4 gap-2", className)}>
      {HERO_MODULES.map((module) => {
        const Icon = module.icon;
        return (
          <div key={module.label} className={authHeroModuleIconClassName()}>
            <Icon className={authHeroModuleGlyphClassName("h-4 w-4")} aria-hidden />
            <span className={authHeroModuleLabelClassName()}>{module.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function HeroStats({ className }: { className?: string }) {
  return (
    <div className={authHeroStatsGridClassName(className)}>
      {LOGIN_HERO_STATS.map((stat) => (
        <div key={stat.label} className={authHeroStatClassName()}>
          <div className={authHeroStatValueClassName()}>{stat.value}</div>
          <div className={authHeroStatLabelClassName()}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export function LoginHeroCard({ className }: { className?: string }) {
  return (
    <div className={authHeroCardClassName(className)}>
      <h2 className={authHeroTitleClassName()}>{LOGIN_HERO_HEADLINE}</h2>
      <p className={authHeroTextClassName()}>{LOGIN_HERO_BODY}</p>
      <HeroModuleIcons />
      <HeroStats />
    </div>
  );
}
