"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboardErrorPanelClass, dashboardErrorMessageClass } from "@/lib/theme";

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
        <div className={dashboardErrorPanelClass()}>
          <AlertTriangle className="w-8 h-8 text-[var(--widget-error-icon)]" aria-hidden />
          <p className={dashboardErrorMessageClass()}>Failed to load this widget.</p>
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
