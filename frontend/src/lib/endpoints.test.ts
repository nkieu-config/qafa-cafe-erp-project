import { describe, it, expect } from 'vitest';
import { API_ENDPOINTS } from './endpoints';

describe('API_ENDPOINTS', () => {
  it('uses correct finance settlement expected path', () => {
    expect(API_ENDPOINTS.finance.expectedCash(3)).toBe(
      '/finance/settlements/expected?branchId=3',
    );
  });

  it('uses correct accounting accounts path', () => {
    expect(API_ENDPOINTS.accounting.accounts).toBe('/accounting/accounts');
  });

  it('uses offset param for audit logs', () => {
    expect(API_ENDPOINTS.audit.logs(100, 0)).toBe('/audit?limit=100&offset=0');
  });

  it('uses branches waste path for legacy stock reporting', () => {
    expect(API_ENDPOINTS.branches.reportWaste(5)).toBe('/branches/5/waste');
  });
});
