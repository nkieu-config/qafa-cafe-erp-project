/** Canonical API paths — single source of truth for frontend HTTP calls. */
export const API_ENDPOINTS = {
  health: '/health',
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  orders: {
    list: (branchId?: number) =>
      branchId ? `/orders?branchId=${branchId}` : '/orders',
    create: '/orders',
    kds: (branchId: number) => `/orders/kds?branchId=${branchId}`,
    updateStatus: (id: number) => `/orders/${id}/status`,
    detail: (id: number) => `/orders/${id}`,
    void: (id: number) => `/orders/${id}/void`,
    refund: (id: number) => `/orders/${id}/refund`,
  },
  products: {
    list: '/products',
    create: '/products',
    update: (id: number) => `/products/${id}`,
    delete: (id: number) => `/products/${id}`,
  },
  modifiers: {
    list: (category?: string) =>
      `/modifiers${category ? `?category=${encodeURIComponent(category)}` : ''}`,
    createGroup: '/modifiers/groups',
    updateGroup: (id: number) => `/modifiers/groups/${id}`,
    deleteGroup: (id: number) => `/modifiers/groups/${id}`,
    createOption: '/modifiers/options',
    updateOption: (id: number) => `/modifiers/options/${id}`,
    deleteOption: (id: number) => `/modifiers/options/${id}`,
  },
  ingredients: {
    list: '/ingredients',
    create: '/ingredients',
    update: (id: number) => `/ingredients/${id}`,
    delete: (id: number) => `/ingredients/${id}`,
    branchInventory: (branchId?: number) =>
      `/ingredients/inventory/branch${branchId ? `?branchId=${branchId}` : ''}`,
    wasteLogs: (branchId?: number) =>
      `/ingredients/waste/logs${branchId ? `?branchId=${branchId}` : ''}`,
  },
  customers: {
    list: (search?: string) =>
      `/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    create: '/customers',
    byPhone: (phone: string) => `/customers/phone/${phone}`,
    detail360: (id: number) => `/customers/${id}/360`,
    detail: (id: number) => `/customers/${id}`,
  },
  promotions: {
    list: '/promotions',
    create: '/promotions',
    validate: '/promotions/validate',
    toggle: (id: number) => `/promotions/${id}/toggle`,
  },
  accounting: {
    accounts: '/accounting/accounts',
    journalEntries: (branchId?: number | string) => {
      if (branchId && branchId !== 'ALL') return `/accounting/journal-entries?branchId=${branchId}`;
      return '/accounting/journal-entries';
    },
    profitLoss: (branchId?: number | string) => {
      if (branchId && branchId !== 'ALL') return `/accounting/profit-loss?branchId=${branchId}`;
      return '/accounting/profit-loss';
    },
    seed: '/accounting/seed',
  },
  audit: {
    logs: (limit: number, offset: number) => `/audit?limit=${limit}&offset=${offset}`,
  },
  branches: {
    list: '/branches',
    create: '/branches',
    update: (id: number) => `/branches/${id}`,
    detail: (id: number) => `/branches/${id}`,
    transfers: (id: number) => `/branches/${id}/transfers`,
    transfersAll: '/branches/transfers/all',
    createTransfer: '/branches/transfers',
    acceptTransfer: (id: number) => `/branches/transfers/${id}/accept`,
    addBatch: (id: number) => `/branches/${id}/batches`,
    reportWaste: (id: number) => `/branches/${id}/waste`,
  },
  finance: {
    expenses: (branchId?: number) =>
      `/finance/expenses${branchId ? `?branchId=${branchId}` : ''}`,
    createExpense: '/finance/expenses',
    settlements: (branchId?: number) =>
      `/finance/settlements${branchId ? `?branchId=${branchId}` : ''}`,
    submitSettlement: '/finance/settlements',
    expectedCash: (branchId: number) => `/finance/settlements/expected?branchId=${branchId}`,
    approveSettlement: (id: number) => `/finance/settlements/${id}/approve`,
    exportSales: (branchId?: number, startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', String(branchId));
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const qs = params.toString();
      return `/finance/export/sales${qs ? `?${qs}` : ''}`;
    },
  },
  inventory: {
    balance: (branchId: number) => `/inventory/branch/${branchId}/balance`,
    stockIn: (branchId: number) => `/inventory/branch/${branchId}/stock-in`,
    waste: (branchId: number) => `/inventory/branch/${branchId}/waste`,
  },
  hr: {
    clockIn: '/hr/clock-in',
    clockOut: '/hr/clock-out',
    attendanceMe: '/hr/attendance/me',
    attendanceStatus: '/hr/attendance/status',
    shiftsByBranch: (branchId: number) => `/hr/shifts/branch/${branchId}`,
    shiftsMe: '/hr/shifts/me',
    createShift: '/hr/shifts',
    leave: (branchId?: number) => `/hr/leave${branchId ? `?branchId=${branchId}` : ''}`,
    leaveMe: '/hr/leave/me',
    createLeave: '/hr/leave',
    updateLeaveStatus: (id: number) => `/hr/leave/${id}/status`,
    payrollRuns: (branchId: number) => `/hr/payroll-runs?branchId=${branchId}`,
    generatePayroll: '/hr/payroll/generate',
    approvePayrollRun: (id: number) => `/hr/payroll-runs/${id}/approve`,
    users: (branchId?: number) => `/hr/users${branchId ? `?branchId=${branchId}` : ''}`,
    updateHourlyRate: (userId: number) => `/hr/users/${userId}/rate`,
    createUser: '/hr/users',
    updateUser: (id: number) => `/hr/users/${id}`,
  },
  procurement: {
    purchaseOrders: '/purchase-orders',
    createPurchaseOrder: '/purchase-orders',
    approvePurchaseOrder: (id: number) => `/purchase-orders/${id}/approve`,
    submitPurchaseOrder: (id: number) => `/purchase-orders/${id}/submit`,
    rejectPurchaseOrder: (id: number) => `/purchase-orders/${id}/reject`,
    receivePurchaseOrder: (id: number) => `/purchase-orders/${id}/receive`,
    suppliers: '/suppliers',
    createSupplier: '/suppliers',
    updateSupplier: (id: number) => `/suppliers/${id}`,
    deleteSupplier: (id: number) => `/suppliers/${id}`,
  },
  production: {
    orders: '/production/orders',
    createOrder: '/production/orders',
    updateStatus: (id: number) => `/production/orders/${id}/status`,
    complete: (id: number) => `/production/orders/${id}/complete`,
    boms: '/production/boms',
    createBom: '/production/boms',
  },
  equipment: {
    list: (branchId?: number) => `/equipment${branchId ? `?branchId=${branchId}` : ''}`,
    create: '/equipment',
    update: (id: number) => `/equipment/${id}`,
    maintenance: (id: number) => `/equipment/${id}/maintenance`,
  },
  reports: {
    executiveSummary: (branchId?: number | string) => {
      if (branchId && branchId !== 'ALL') return `/reports/executive-summary?branchId=${branchId}`;
      return '/reports/executive-summary';
    },
    topProducts: (branchId?: number | string) => {
      if (branchId && branchId !== 'ALL') return `/reports/top-products?branchId=${branchId}`;
      return '/reports/top-products';
    },
    salesTrends: (branchId?: number) =>
      `/reports/sales-trends${branchId ? `?branchId=${branchId}` : ''}`,
    profitLoss: (branchId?: number) =>
      `/reports/profit-loss${branchId ? `?branchId=${branchId}` : ''}`,
  },
  settings: {
    get: '/settings',
    update: '/settings',
  },
  navCounts: (branchId?: number | null) =>
    branchId != null
      ? `/nav-counts?branchId=${branchId}`
      : '/nav-counts',
} as const;
