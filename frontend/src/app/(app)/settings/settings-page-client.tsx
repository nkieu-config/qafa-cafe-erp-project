"use client";

import { useState, useEffect, useMemo } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/domains/useSettingsQueries";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { Store, Receipt, Calculator, Banknote, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { parseVatRatePercent } from "@/lib/vat";
import {
  formFieldInsetClassName,
  hubCtaClassName,
  hubCardIconFor,
  hubLoadingSpinnerClassName,
  metricValueClassName,
  settingsSectionClassName,
  settingsSectionHeaderClassName,
  settingsSectionPanelClassName,
  settingsSectionTitleClassName,
  statusInlineAlertClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const EMPTY_FORM: Record<string, string> = {
  companyName: "",
  taxId: "",
  vatRate: "7",
  currency: "THB",
  receiptFooter: "Thank you for your business!",
};

function settingsToForm(settings: Record<string, string | undefined>): Record<string, string> {
  return {
    companyName: settings.companyName || "",
    taxId: settings.taxId || "",
    vatRate: settings.vatRate || "7",
    currency: settings.currency || "THB",
    receiptFooter: settings.receiptFooter || "Thank you for your business!",
  };
}

export default function SettingsPage() {
  const { data: settings, isLoading, isError, error, refetch, isFetching } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [formData, setFormData] = useState<Record<string, string>>(EMPTY_FORM);
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, string>>(EMPTY_FORM);

  useEffect(() => {
    if (settings) {
      const next = settingsToForm(settings);
      setFormData(next);
      setSavedSnapshot(next);
    }
  }, [settings]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedSnapshot),
    [formData, savedSnapshot],
  );

  useUnsavedChangesGuard(isDirty);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const vatRate = parseVatRatePercent(formData.vatRate);
    if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
      toast.error("VAT rate must be between 0 and 100");
      return;
    }
    if (!formData.currency.trim()) {
      toast.error("Default currency is required");
      return;
    }

    updateSettingsMutation.mutate(formData, {
      onSuccess: () => setSavedSnapshot(formData),
    });
  };

  return (
    <div className="space-y-6 max-w-4xl w-full">
      <HubPageHeader
        hideTitle
        accentHub="settings"
        actions={
          <Button
            className={hubCtaClassName("settings", "font-bold min-h-[44px]")}
            onClick={handleSave}
            disabled={isLoading || isError || updateSettingsMutation.isPending || !isDirty}
          >
            <Save className="w-4 h-4 mr-2" aria-hidden />
            {updateSettingsMutation.isPending ? "Saving…" : "Save settings"}
          </Button>
        }
      />

      {isDirty && (
        <div role="status" className={statusInlineAlertClassName("warning")}>
          You have unsaved changes. Save before leaving this page.
        </div>
      )}

      <div className={settingsSectionPanelClassName()}>
        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load settings.") : undefined}
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className={cn("w-8 h-8", hubLoadingSpinnerClassName())} aria-hidden />
            <span className="sr-only">Loading settings</span>
          </div>
        ) : !isError ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className={settingsSectionClassName()}>
              <div className={settingsSectionHeaderClassName()}>
                <Store className={cn("w-5 h-5", metricValueClassName("blue"))} aria-hidden />
                <h3 className={settingsSectionTitleClassName()}>Company information</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-company-name" className={text.secondary}>
                    Company name (legal)
                  </Label>
                  <Input
                    id="settings-company-name"
                    value={formData.companyName}
                    onChange={(event) => handleChange("companyName", event.target.value)}
                    placeholder="e.g. Qafa Cafe Co., Ltd."
                    className={formFieldInsetClassName()}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings-tax-id" className={text.secondary}>
                    Tax ID
                  </Label>
                  <Input
                    id="settings-tax-id"
                    value={formData.taxId}
                    onChange={(event) => handleChange("taxId", event.target.value)}
                    placeholder="13-digit tax ID"
                    className={formFieldInsetClassName()}
                  />
                </div>
              </div>
            </div>

            <div className={settingsSectionClassName()}>
              <div className={settingsSectionHeaderClassName()}>
                <Calculator className={hubCardIconFor("finance")} aria-hidden />
                <h3 className={settingsSectionTitleClassName()}>Finance &amp; tax</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-vat-rate" className={text.secondary}>
                      VAT rate (%)
                    </Label>
                    <Input
                      id="settings-vat-rate"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={formData.vatRate}
                      onChange={(event) => handleChange("vatRate", event.target.value)}
                      placeholder="e.g. 7"
                      className={formFieldInsetClassName()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settings-currency" className={text.secondary}>
                      Default currency
                    </Label>
                    <div className="relative">
                      <Banknote
                        className={cn(
                          "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none",
                          text.muted,
                        )}
                        aria-hidden
                      />
                      <Input
                        id="settings-currency"
                        className={formFieldInsetClassName("pl-9")}
                        value={formData.currency}
                        onChange={(event) => handleChange("currency", event.target.value)}
                        placeholder="e.g. THB"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={settingsSectionClassName("md:col-span-2")}>
              <div className={settingsSectionHeaderClassName()}>
                <Receipt className={hubCardIconFor("pos")} aria-hidden />
                <h3 className={settingsSectionTitleClassName()}>Point of Sale (POS)</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-receipt-footer" className={text.secondary}>
                    Receipt footer message
                  </Label>
                  <Input
                    id="settings-receipt-footer"
                    value={formData.receiptFooter}
                    onChange={(event) => handleChange("receiptFooter", event.target.value)}
                    placeholder="e.g. Thank you for your business!"
                    className={formFieldInsetClassName()}
                  />
                  <p className={cn("text-xs", text.muted)}>
                    Printed at the bottom of customer receipts from the POS terminal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
