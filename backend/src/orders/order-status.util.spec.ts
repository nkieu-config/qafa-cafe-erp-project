import {
  productRequiresKitchen,
  resolveInitialOrderStatus,
} from './order-status.util';

describe('order-status.util', () => {
  it('detects kitchen-prep categories', () => {
    expect(productRequiresKitchen('Coffee')).toBe(true);
    expect(productRequiresKitchen('Hot Beverage')).toBe(true);
    expect(productRequiresKitchen('Bakery')).toBe(false);
  });

  it('queues beverage orders for KDS', () => {
    expect(
      resolveInitialOrderStatus([
        { category: 'Coffee' },
        { category: 'Bakery' },
      ]),
    ).toBe('PENDING');
  });

  it('completes retail-only orders at payment', () => {
    expect(resolveInitialOrderStatus([{ category: 'Bakery' }])).toBe(
      'COMPLETED',
    );
  });
});
