"use client";

import { useState, useEffect, useMemo } from "react";
import { useProducts, useCreateOrder, useCustomerByPhone, useValidatePromotion } from '@/hooks/domains/usePosQueries';
import { useModifiers } from '@/hooks/domains/useModifierQueries';
import { useSettings } from '@/hooks/domains/useSettingsQueries';
import { useBranches } from '@/hooks/domains/useGeneralQueries';
import { useAuth } from "@/context/AuthContext";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { HubListPage } from "@/components/shared/hub-list-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Product } from "@/types/api";
import { ShoppingBag, User, Ticket, Award, Search, X, Printer, Plus, Minus, Settings2, Loader2 } from "lucide-react";
import { Receipt } from "@/components/pos/Receipt";
import { useReactToPrint } from "react-to-print";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useRef } from "react";
import { OnScreenNumpad } from "@/components/pos/OnScreenNumpad";
import { pointsToDiscountBaht } from "@/lib/loyalty";
import { filterActive } from "@/lib/form";
import { toNumber, formatBaht } from "@/lib/money";
import { formatQueueNumber } from "@/lib/queue";
import { parseVatRatePercent } from "@/lib/vat";
import type { Customer, ValidatedPromotion, ReceiptOrder, ModifierGroup } from "@/types/api";
import {
  posProductCardClassName,
  posPriceClassName,
  posAddButtonClassName,
  posCartPanelClassName,
  posCartHeaderClassName,
  posCartSectionClassName,
  posCartBadgeClassName,
  posAccentIconClassName,
  posAccentTextClassName,
  posSummaryPanelClassName,
  posSummaryMutedClassName,
  posSummaryTotalClassName,
  posPayActionClassName,
  posCrmPanelClassName,
  posCrmTitleClassName,
  posCrmMutedClassName,
  posPromoPanelClassName,
  posPromoTitleClassName,
  posDashedButtonClassName,
  posInputClassName,
  posRemoveItemClassName,
  posEmptyProductsClassName,
  posSuccessDialogClassName,
  posSuccessTitleClassName,
  posReceiptPreviewClassName,
  posQueueNumberClassName,
  posModifierSelectedClassName,
  posPrimaryActionClassName,
  posLoadingSpinnerClassName,
  posDialogContentClassName,
  posCategoryChipClassName,
  posCartEmptyIconClassName,
  text,
} from "@/lib/theme";
import type { Branch } from "@/types/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

export default function POSPage() {
  const { user, activeBranchId } = useAuth();
  const { data: branches = [] } = useBranches();
  const branchNameForReceipt =
    activeBranchId != null
      ? (branches as Branch[]).find((b) => b.id === activeBranchId)?.name
      : user?.branch ?? "Branch";
  const { data: settings } = useSettings();
  const { data: productsData, isLoading: loading, isError: productsError, error: productsErr, refetch: refetchProducts, isFetching: productsFetching } = useProducts();
  const products = filterActive<Product>((productsData || []) as Product[]);
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebouncedValue(productSearch.trim().toLowerCase(), 200);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const q = debouncedProductSearch;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, categoryFilter, debouncedProductSearch]);
  const [cart, setCart] = useState<{
    id: string;
    product: Product;
    quantity: number;
    notes?: string;
    modifierOptionIds?: number[];
    unitPrice: number;
  }[]>([]);

  // Modifiers State
  const [showModifiers, setShowModifiers] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<number, number>>({});
  const modifierCategory = selectedProduct?.category?.toLowerCase().includes('coffee')
    ? 'Coffee'
    : selectedProduct?.category?.toLowerCase().includes('beverage')
      ? 'Beverage'
      : undefined;
  const { data: modifierGroups = [] } = useModifiers(modifierCategory) as { data: ModifierGroup[] };

  // CRM State
  const [showNumpad, setShowNumpad] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  
  // Promo State
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<ValidatedPromotion | null>(null);

  // Checkout State
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT_CARD' | 'QR_PROMPTPAY'>('CASH');
  const [isTaxInvoiceRequested, setIsTaxInvoiceRequested] = useState(false);
  const [taxInvoiceName, setTaxInvoiceName] = useState("");
  const [taxInvoiceTaxId, setTaxInvoiceTaxId] = useState("");
  const [taxInvoiceAddress, setTaxInvoiceAddress] = useState("");

  // Receipt & Success State
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<ReceiptOrder | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${completedOrder?.id || 'new'}`,
  });

  const createOrderMutation = useCreateOrder();
  const getCustomerMutation = useCustomerByPhone();
  const validatePromoMutation = useValidatePromotion();

  const handleProductClick = (product: Product) => {
    const cat = product.category.toLowerCase();
    if (cat.includes('coffee') || cat.includes('beverage')) {
      setSelectedProduct(product);
      setShowModifiers(true);
    } else {
      addToCart(product);
    }
  };

  useEffect(() => {
    if (!showModifiers || modifierGroups.length === 0) return;
    const defaults: Record<number, number> = {};
    for (const group of modifierGroups) {
      const def = group.options.find((o) => o.isDefault) ?? group.options[0];
      if (def) defaults[group.id] = def.id;
    }
    setSelectedModifiers(defaults);
  }, [showModifiers, selectedProduct?.id, modifierGroups]);

  const getModifierSummary = (groups: ModifierGroup[], picks: Record<number, number>) =>
    groups
      .map((g) => {
        const opt = g.options.find((o) => o.id === picks[g.id]);
        return opt ? `${g.name}: ${opt.name}` : null;
      })
      .filter(Boolean)
      .join(', ');

  const getModifierExtra = (groups: ModifierGroup[], picks: Record<number, number>) =>
    groups.reduce((sum, g) => {
      const opt = g.options.find((o) => o.id === picks[g.id]);
      return sum + (opt ? toNumber(opt.priceDelta) : 0);
    }, 0);

  const addToCart = (
    product: Product,
    notes?: string,
    modifierOptionIds?: number[],
    unitPrice?: number,
  ) => {
    const price = unitPrice ?? toNumber(product.price);
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          item.notes === notes &&
          JSON.stringify(item.modifierOptionIds ?? []) === JSON.stringify(modifierOptionIds ?? []),
      );
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          id: Date.now().toString() + Math.random(),
          product,
          quantity: 1,
          notes,
          modifierOptionIds,
          unitPrice: price,
        },
      ];
    });
    setShowModifiers(false);
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartId));
  };

  const adjustCartQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === cartId ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  
  // Recalculate promo if subtotal changes (e.g. minPurchase rule)
  useEffect(() => {
    if (appliedPromo && appliedPromo.minPurchase && subtotal < appliedPromo.minPurchase) {
      toast.warning("Promotion removed due to minimum purchase requirement.");
      setAppliedPromo(null);
    }
  }, [subtotal, appliedPromo]);

  const promoDiscount = appliedPromo 
    ? (appliedPromo.type === 'PERCENTAGE' ? subtotal * (appliedPromo.value / 100) : appliedPromo.value)
    : 0;
  
  const pointsDiscount = pointsToDiscountBaht(pointsToRedeem);
  const totalDiscount = Math.min(promoDiscount + pointsDiscount, subtotal);
  const netTotal = subtotal - totalDiscount;
  const pointsEarned = customer ? Math.floor(netTotal / 100) : 0;

  // Handlers
  const handleFindCustomer = async () => {
    if (!customerPhone) return;
    try {
      const data = await getCustomerMutation.mutateAsync(customerPhone);
      setCustomer(data);
      toast.success(`Found member: ${data.name}`);
    } catch (err: unknown) {
      toast.error("Customer not found");
      setCustomer(null);
      setPointsToRedeem(0);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    try {
      const data = await validatePromoMutation.mutateAsync({ code: promoCode, subtotal });
      setAppliedPromo(data);
      toast.success("Promotion applied!");
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
      setAppliedPromo(null);
    }
  };

  const handleClearCRM = () => {
    setCustomer(null);
    setCustomerPhone("");
    setPointsToRedeem(0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (!activeBranchId) {
      toast.error("Please select a branch first.");
      return;
    }
    
    try {
      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        ...(item.notes ? { notes: item.notes } : {}),
        ...(item.modifierOptionIds?.length
          ? { modifierOptionIds: item.modifierOptionIds }
          : {}),
      }));
      const orderData = await createOrderMutation.mutateAsync({
        branchId: activeBranchId,
        items,
        customerPhone: customer?.phone,
        promotionCode: appliedPromo?.code,
        pointsToRedeem: pointsToRedeem > 0 ? pointsToRedeem : undefined,
        paymentMethod,
        isTaxInvoiceRequested,
        taxInvoiceName: isTaxInvoiceRequested ? taxInvoiceName : undefined,
        taxInvoiceTaxId: isTaxInvoiceRequested ? taxInvoiceTaxId : undefined,
        taxInvoiceAddress: isTaxInvoiceRequested ? taxInvoiceAddress : undefined,
      });
      
      toast.success("Order completed successfully!");
      
      // Prepare receipt data
      setCompletedOrder({
        id: orderData.id,
        queueNumber: orderData.queueNumber,
        cashier: user?.name,
        customerName: customer?.name,
        items: cart,
        subtotal,
        discount: totalDiscount,
        netTotal
      });
      setShowSuccess(true);
      
      setCart([]);
      handleClearCRM();
      setAppliedPromo(null);
      setPromoCode("");
      setShowCheckout(false);
      setPaymentMethod('CASH');
      setIsTaxInvoiceRequested(false);
      setTaxInvoiceName("");
      setTaxInvoiceTaxId("");
      setTaxInvoiceAddress("");
    } catch (err: unknown) {
      if (err instanceof Error) toast.error("Checkout failed: " + err.message);
    }
  };



  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to process sales at the POS terminal." />
    );
  }

  return (
    <div className="flex h-full flex-col lg:flex-row gap-4 lg:gap-6 w-full min-h-0">
      {/* Products Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0 lg:pr-2 pb-10 space-y-4">
        <HubListPage.Error
          message={
            productsError ? getErrorMessage(productsErr, "Failed to load menu items") : undefined
          }
          onRetry={() => void refetchProducts()}
          loading={productsFetching}
        />
        <div className="sticky top-0 z-10 space-y-3 rounded-xl border border-[var(--pos-panel-border)] bg-[var(--pos-panel-bg)] p-3 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)] pointer-events-none" aria-hidden />
            <Input
              type="search"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search menu items…"
              className={cn(posInputClassName(), "pl-9 min-h-[44px]")}
              aria-label="Search menu items"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={posCategoryChipClassName(categoryFilter === null)}
                onClick={() => setCategoryFilter(null)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={posCategoryChipClassName(categoryFilter === cat)}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className={`w-10 h-10 animate-spin ${posLoadingSpinnerClassName()}`} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredProducts.map((product: Product) => (
            <Card 
              key={product.id} 
              className={posProductCardClassName()}
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className={`text-lg ${text.primary}`}>{product.name}</CardTitle>
                <CardDescription>{product.category}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex justify-between items-center">
                <span className={posPriceClassName()}>{formatBaht(product.price)}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(posAddButtonClassName(), "min-h-[44px]")}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleProductClick(product);
                  }}
                >
                  Add
                </Button>
              </CardContent>
            </Card>
          ))}
          {filteredProducts.length === 0 && (
            <div className={posEmptyProductsClassName()}>
              {products.length === 0
                ? "No menu items yet. Ask a manager to add products under Products → Menu Items."
                : "No items match your search. Try another keyword or category."}
            </div>
          )}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className={posCartPanelClassName("w-full lg:w-[min(420px,100%)] lg:shrink-0 flex flex-col")}>
        <div className={posCartHeaderClassName()}>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${text.primary}`}>
            <ShoppingBag size={20} className={posAccentIconClassName()} /> Current Order
          </h2>
          <span className={posCartBadgeClassName()}>
            {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center gap-3 border-b border-[var(--pos-panel-border)]/50 pb-3">
              <div className="min-w-0 flex-1">
                <div className={`font-semibold ${text.primary}`}>{item.product.name}</div>
                {item.notes && <div className={`text-xs font-medium mb-1 line-clamp-2 ${posAccentTextClassName()}`}>{item.notes}</div>}
                <div className={`text-sm tabular-nums ${text.muted}`}>{formatBaht(item.unitPrice)} each</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center rounded-lg border border-[var(--pos-panel-border)] overflow-hidden">
                  <Button
                    type="button"
                    aria-label={`Decrease ${item.product.name} quantity`}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-none"
                    onClick={() => adjustCartQuantity(item.id, -1)}
                  >
                    <Minus className="w-4 h-4" aria-hidden />
                  </Button>
                  <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums px-1">
                    {item.quantity}
                  </span>
                  <Button
                    type="button"
                    aria-label={`Increase ${item.product.name} quantity`}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-none"
                    onClick={() => adjustCartQuantity(item.id, 1)}
                  >
                    <Plus className="w-4 h-4" aria-hidden />
                  </Button>
                </div>
                <span className={`font-bold tabular-nums min-w-[4.5rem] text-right ${text.secondary}`}>
                  {formatBaht(item.unitPrice * item.quantity)}
                </span>
                <Button
                  aria-label={`Remove ${item.product.name}`}
                  variant="ghost"
                  size="sm"
                  className={posRemoveItemClassName("h-9 w-9 p-0")}
                  onClick={() => removeFromCart(item.id)}
                >
                  <X className="w-4 h-4" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className={`text-center mt-10 flex flex-col items-center gap-2 ${text.muted}`}>
              <ShoppingBag size={48} className={posCartEmptyIconClassName()} aria-hidden />
              <span>Cart is empty</span>
            </div>
          )}
        </div>

        {/* CRM & Promo Section */}
        <div className={posCartSectionClassName()}>
          
          {/* Customer CRM */}
          <div className="space-y-2">
            {!customer ? (
              <Button 
                variant="outline" 
                className={posDashedButtonClassName("h-12")}
                onClick={() => setShowNumpad(true)}
              >
                <Search className="w-4 h-4 mr-2" /> Find Member via Phone
              </Button>
            ) : (
              <div className={posCrmPanelClassName()}>
                <Button aria-label="Clear customer" variant="ghost" size="sm" className={`absolute top-1 right-1 h-6 w-6 p-0 ${posCrmMutedClassName()}`} onClick={handleClearCRM}>
                  <X className="w-4 h-4" />
                </Button>
                <div className={`${posCrmTitleClassName()} mb-1`}>
                  <User className="w-4 h-4" /> {customer.name} <Badge variant="outline" className={`bg-[var(--pos-input-bg)] text-[10px] uppercase font-bold tracking-wider py-0 px-2`}>{customer.tier}</Badge>
                </div>
                <div className={`${posCrmMutedClassName()} mb-2`}>Available: {customer.points} pts (฿{pointsToDiscountBaht(customer.points)})</div>
                {customer.points > 0 && (
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="number" 
                      min="0" 
                      max={customer.points} 
                      placeholder="Pts to redeem" 
                      value={pointsToRedeem || ''}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        if (Number.isNaN(next)) {
                          setPointsToRedeem(0);
                          return;
                        }
                        setPointsToRedeem(Math.min(Math.max(0, next), customer.points));
                      }}
                      className={posInputClassName("h-8")}
                    />
                    <span className={`text-xs whitespace-nowrap ${text.muted}`}>10 pts = ฿1</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Promo Code */}
          <div className="space-y-2">
            {!appliedPromo ? (
              <div className="flex gap-2">
                <Input 
                  placeholder="Promo Code" 
                  value={promoCode} 
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())} 
                  className={posInputClassName("uppercase")}
                />
                <Button variant="secondary" onClick={handleApplyPromo}>Apply</Button>
              </div>
            ) : (
              <div className={posPromoPanelClassName()}>
                <div className={posPromoTitleClassName()}>
                  <Ticket className="w-4 h-4" /> {appliedPromo.code}
                </div>
                <Button aria-label="Remove promotion" variant="ghost" size="sm" className={`h-6 w-6 p-0 ${posPromoTitleClassName()}`} onClick={() => setAppliedPromo(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

        </div>

        {/* Summary */}
        <div className={posSummaryPanelClassName()}>
          <div className={`flex justify-between ${posSummaryMutedClassName()}`}>
            <span>Subtotal</span>
            <span className="tabular-nums">฿{subtotal.toLocaleString()}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-[var(--pos-summary-discount)]">
              <span>Discount</span>
              <span className="tabular-nums">- ฿{totalDiscount.toLocaleString()}</span>
            </div>
          )}
          <div className={`flex justify-between text-2xl font-bold pt-2 border-t border-[var(--pos-summary-divider)]`}>
            <span>Total</span>
            <span className={posSummaryTotalClassName()}>฿{netTotal.toLocaleString()}</span>
          </div>
          {pointsEarned > 0 && (
            <div className="flex justify-end text-xs text-[var(--pos-summary-reward)] pt-1">
              <Award className="w-3 h-3 mr-1" /> Earn {pointsEarned} pts
            </div>
          )}
          <Button 
            className={posPayActionClassName("w-full h-12 text-lg font-bold mt-4")} 
            disabled={cart.length === 0}
            onClick={() => setShowCheckout(true)}
          >
            Confirm & Pay
          </Button>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className={posDialogContentClassName("sm:max-w-[425px]")}>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Total to pay: ฿{netTotal.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                  className="min-h-[44px]"
                  onClick={() => setPaymentMethod('CASH')}
                >Cash</Button>
                <Button 
                  variant={paymentMethod === 'CREDIT_CARD' ? 'default' : 'outline'}
                  className="min-h-[44px]"
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                >Card</Button>
                <Button 
                  variant={paymentMethod === 'QR_PROMPTPAY' ? 'default' : 'outline'}
                  className="min-h-[44px]"
                  onClick={() => setPaymentMethod('QR_PROMPTPAY')}
                >QR</Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2 border-t pt-4">
              <input 
                type="checkbox" 
                id="tax-invoice"
                checked={isTaxInvoiceRequested}
                onChange={(e) => setIsTaxInvoiceRequested(e.target.checked)}
                className="rounded border-[var(--pos-input-border)] w-4 h-4"
              />
              <label htmlFor="tax-invoice" className="text-sm font-medium cursor-pointer">Request e-Tax Invoice</label>
            </div>
            
            {isTaxInvoiceRequested && (
              <div className={`space-y-3 p-3 rounded-lg border bg-[var(--pos-panel-muted-bg)] border-[var(--pos-panel-border)]`}>
                <Input 
                  placeholder="Company / Individual Name" 
                  value={taxInvoiceName}
                  onChange={(e) => setTaxInvoiceName(e.target.value)}
                />
                <Input 
                  placeholder="Tax ID (13 digits)" 
                  value={taxInvoiceTaxId}
                  onChange={(e) => setTaxInvoiceTaxId(e.target.value)}
                />
                <Input 
                  placeholder="Full Address" 
                  value={taxInvoiceAddress}
                  onChange={(e) => setTaxInvoiceAddress(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleCheckout}
              className={posPrimaryActionClassName("w-full min-h-[44px]")}
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin motion-reduce:animate-none" aria-hidden />
                  Processing…
                </>
              ) : (
                <>Pay ฿{netTotal.toLocaleString()}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success & Print Dialog */}
      <Dialog open={showSuccess} onOpenChange={(open) => {
        if (!open) setShowSuccess(false);
      }}>
        <DialogContent className={posSuccessDialogClassName(posDialogContentClassName("sm:max-w-[400px]"))}>
          <DialogHeader>
            <DialogTitle className={posSuccessTitleClassName()}>
              <Award className="w-12 h-12" />
              Order Completed!
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 flex justify-center">
            {/* Hidden Receipt Component to be printed */}
            <div className="hidden">
              {completedOrder && (
                <Receipt
                  ref={receiptRef}
                  order={completedOrder}
                  branchName={branchNameForReceipt}
                  settings={{
                    companyName: settings?.companyName,
                    taxId: settings?.taxId,
                    vatRate: parseVatRatePercent(settings?.vatRate),
                    receiptFooter: settings?.receiptFooter,
                  }}
                />
              )}
            </div>
            
            {/* Preview */}
            <div className={posReceiptPreviewClassName()}>
              {completedOrder?.queueNumber != null && completedOrder.queueNumber > 0 && (
                <p className={posQueueNumberClassName()}>
                  #{formatQueueNumber(completedOrder.queueNumber)}
                </p>
              )}
              <p className="font-bold border-b border-[var(--pos-panel-border)] pb-2 mb-2">
                {completedOrder?.queueNumber ? 'Your Queue Number' : 'Receipt Preview'}
              </p>
              <p>Total: ฿{completedOrder?.netTotal?.toFixed(2)}</p>
              <p className={`text-xs ${text.muted}`}>
                Order ref #{completedOrder?.id}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={() => handlePrint()} className={posPrimaryActionClassName("w-full h-12 text-lg")}>
              <Printer className="w-5 h-5 mr-2" />
              Print Receipt
            </Button>
            <Button variant="outline" onClick={() => setShowSuccess(false)} className="w-full h-12 text-lg">
              <Plus className="w-5 h-5 mr-2" />
              New Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modifiers Modal */}
      <Dialog open={showModifiers} onOpenChange={setShowModifiers}>
        <DialogContent className={posDialogContentClassName("sm:max-w-[400px]")}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-xl`}><Settings2 className={`w-5 h-5 ${posAccentIconClassName()}`}/> Customize {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {modifierGroups.map((group) => (
              <div key={group.id} className="space-y-3">
                <label className={`text-sm font-bold ${text.secondary}`}>{group.name}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.options.map((opt) => (
                    <Button
                      key={opt.id}
                      variant={selectedModifiers[group.id] === opt.id ? 'default' : 'outline'}
                      className={selectedModifiers[group.id] === opt.id ? posModifierSelectedClassName() : ''}
                      onClick={() => setSelectedModifiers((prev) => ({ ...prev, [group.id]: opt.id }))}
                    >
                      {opt.name}
                      {toNumber(opt.priceDelta) > 0 ? ` +${formatBaht(opt.priceDelta)}` : ''}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {modifierGroups.length === 0 && (
              <p className={`text-sm ${text.muted}`}>No modifiers configured for this category.</p>
            )}
          </div>
          <DialogFooter>
            <Button
              className={posPrimaryActionClassName("w-full h-12 text-lg font-bold")}
              onClick={() => {
                if (!selectedProduct) return;
                const summary = getModifierSummary(modifierGroups, selectedModifiers);
                const optionIds = Object.values(selectedModifiers);
                const extra = getModifierExtra(modifierGroups, selectedModifiers);
                addToCart(
                  selectedProduct,
                  summary || undefined,
                  optionIds.length ? optionIds : undefined,
                  toNumber(selectedProduct.price) + extra,
                );
              }}
            >
              Add to Order · {formatBaht(toNumber(selectedProduct?.price ?? 0) + getModifierExtra(modifierGroups, selectedModifiers))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Numpad Modal */}
      <Dialog open={showNumpad} onOpenChange={setShowNumpad}>
        <DialogContent className={posDialogContentClassName("sm:max-w-[360px] bg-transparent border-none shadow-none p-0")}>
          <OnScreenNumpad 
            value={customerPhone}
            onChange={setCustomerPhone}
            onClose={() => setShowNumpad(false)}
            onSubmit={() => { setShowNumpad(false); handleFindCustomer(); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
