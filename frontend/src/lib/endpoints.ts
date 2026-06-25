/** Canonical API paths — single source of truth for frontend HTTP calls. */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
  },
  accounting: {
    accounts: '/accounting/accounts',
    journalEntries: '/accounting/journal-entries',
    profitLoss: '/accounting/profit-loss',
  },
  audit: {
    logs: (limit: number, offset: number) => `/audit?limit=${limit}&offset=${offset}`,
  },
  branches: {
    list: '/branches',
    detail: (id: number) => `/branches/${id}`,
    transfers: (id: number) => `/branches/${id}/transfers`,
    createTransfer: '/branches/transfers',
    acceptTransfer: (id: number) => `/branches/transfers/${id}/accept`,
    addBatch: (id: number) => `/branches/${id}/batches`,
    reportWaste: (id: number) => `/branches/${id}/waste`,
  },
  finance: {
    expenses: '/finance/expenses',
    settlements: '/finance/settlements',
    expectedCash: (branchId: number) => `/finance/settlements/expected?branchId=${branchId}`,
    approveSettlement: (id: number) => `/finance/settlements/${id}/approve`,
  },
  inventory: {
    balance: (branchId: number) => `/inventory/branch/${branchId}/balance`,
    stockIn: (branchId: number) => `/inventory/branch/${branchId}/stock-in`,
    waste: (branchId: number) => `/inventory/branch/${branchId}/waste`,
  },
  ingredients: {
    wasteLogs: (branchId?: number) =>
      `/ingredients/waste/logs${branchId ? `?branchId=${branchId}` : ''}`,
  },
} as const;
