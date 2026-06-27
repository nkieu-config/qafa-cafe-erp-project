import { MapPin } from "lucide-react";

type BranchEmptyStateProps = {
  title?: string;
  description?: string;
};

export function BranchEmptyState({
  title = "Select a branch",
  description = "Use the branch selector in the top bar to view branch-specific data.",
}: BranchEmptyStateProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center max-w-lg mx-auto">
      <MapPin className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
      <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{description}</p>
    </div>
  );
}
