"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  onReset?: () => void;
};

type State = { hasError: boolean };

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full min-h-[200px] flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Failed to load this widget.</p>
          {this.props.onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onReset?.();
              }}
            >
              Try again
            </Button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
