import { describe, it, expect } from 'vitest';
import { API_ENDPOINTS } from './endpoints';

describe('API_ENDPOINTS', () => {
  it('builds finance expected cash path', () => {
    expect(API_ENDPOINTS.finance.expectedCash(3)).toBe(
      '/finance/settlements/expected?branchId=3',
    );
  });

  it('builds accounting accounts path', () => {
    expect(API_ENDPOINTS.accounting.accounts).toBe('/accounting/accounts');
  });

  it('builds audit logs path with offset', () => {
    expect(API_ENDPOINTS.audit.logs(100, 0)).toBe('/audit?limit=100&offset=0');
  });

  it('builds branch waste path', () => {
    expect(API_ENDPOINTS.branches.reportWaste(5)).toBe('/branches/5/waste');
  });

  it('builds HR payroll path', () => {
    expect(API_ENDPOINTS.hr.payrollRuns(2)).toBe('/hr/payroll-runs?branchId=2');
  });

  it('builds optional report branch filter', () => {
    expect(API_ENDPOINTS.reports.executiveSummary('ALL')).toBe('/reports/executive-summary');
    expect(API_ENDPOINTS.reports.executiveSummary(4)).toBe('/reports/executive-summary?branchId=4');
  });

  it('builds auth session paths', () => {
    expect(API_ENDPOINTS.auth.login).toBe('/auth/login');
    expect(API_ENDPOINTS.auth.logout).toBe('/auth/logout');
    expect(API_ENDPOINTS.auth.me).toBe('/auth/me');
  });

  it('builds nav counts path', () => {
    expect(API_ENDPOINTS.navCounts()).toBe('/nav-counts');
    expect(API_ENDPOINTS.navCounts(4)).toBe('/nav-counts?branchId=4');
  });
});
