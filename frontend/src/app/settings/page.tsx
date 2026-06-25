"use client";

import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/domains/useSettingsQueries";
import { AnimatedPage } from "@/components/animated-page";
import { PageHeader } from "@/components/shared/page-header";
import { Settings as SettingsIcon, Save, Store, Receipt, Calculator, Banknote, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/RoleGuard";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [formData, setFormData] = useState<Record<string, string>>({
    companyName: "",
    taxId: "",
    vatRate: "7",
    currency: "THB",
    receiptFooter: "Thank you for your business!"
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || "",
        taxId: settings.taxId || "",
        vatRate: settings.vatRate || "7",
        currency: settings.currency || "THB",
        receiptFooter: settings.receiptFooter || "Thank you for your business!"
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
  };


  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']} fallback={<div className="p-8 text-slate-500">Access denied. Super Admin only.</div>}>
    <AnimatedPage className="space-y-6 max-w-4xl mx-auto w-full">
      <PageHeader 
        title="System Settings"
        icon={SettingsIcon}
        description="Global configuration for your ERP system. These settings apply to all branches."
        actions={
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2"
            onClick={handleSave}
            disabled={isLoading || updateSettingsMutation.isPending}
          >
            <Save className="w-4 h-4" />
            {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
        {/* Company Info */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Store className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Company Information</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name (Legal)</Label>
              <Input 
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="e.g. Qafa Cafe Co., Ltd."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tax ID</Label>
              <Input 
                value={formData.taxId}
                onChange={(e) => handleChange("taxId", e.target.value)}
                placeholder="13-digit Tax ID"
              />
            </div>
          </div>
        </div>

        {/* Finance & Tax */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Calculator className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Finance & Tax</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>VAT Rate (%)</Label>
                <Input 
                  type="number"
                  value={formData.vatRate}
                  onChange={(e) => handleChange("vatRate", e.target.value)}
                  placeholder="e.g. 7"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    className="pl-9"
                    value={formData.currency}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    placeholder="e.g. THB"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Point of Sale */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Receipt className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Point of Sale (POS)</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Receipt Footer Message</Label>
              <Input 
                value={formData.receiptFooter}
                onChange={(e) => handleChange("receiptFooter", e.target.value)}
                placeholder="e.g. Thank you for your business! Password WiFi: qafa123"
              />
              <p className="text-xs text-slate-500">This message will be printed at the bottom of all customer receipts.</p>
            </div>
          </div>
        </div>

        </div>
      )}
    </AnimatedPage>
    </RoleGuard>
  );
}
