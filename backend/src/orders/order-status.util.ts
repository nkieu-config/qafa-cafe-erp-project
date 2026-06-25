const KITCHEN_CATEGORIES = /coffee|beverage|drink|tea/i;

export function productRequiresKitchen(category: string): boolean {
  return KITCHEN_CATEGORIES.test(category);
}

export function resolveInitialOrderStatus(
  products: { category: string }[],
): 'PENDING' | 'COMPLETED' {
  return products.some((p) => productRequiresKitchen(p.category))
    ? 'PENDING'
    : 'COMPLETED';
}
