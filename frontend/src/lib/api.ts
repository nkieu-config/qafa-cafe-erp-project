const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error(errorData.message || 'An error occurred while fetching data');
  }

  const text = await response.text();
  if (!text || text.trim() === '') return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse JSON response:', text);
    return null;
  }
}

// Auth
export const loginApi = (data: any) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) });

// Ingredients
export const getIngredients = () => fetchAPI('/ingredients');
export const createIngredient = (data: { name: string; unit: string; stock: number; minStock: number }) => 
  fetchAPI('/ingredients', { method: 'POST', body: JSON.stringify(data) });

// Products
export const getProducts = () => fetchAPI('/products');
export const createProduct = (data: { name: string; price: number; category: string; recipeItems?: { ingredientId: number, quantity: number }[] }) => 
  fetchAPI('/products', { method: 'POST', body: JSON.stringify(data) });

// Orders
export const createOrder = (data: { userId: number; branchId: number; items: { productId: number; quantity: number }[]; customerPhone?: string; promotionCode?: string; pointsToRedeem?: number; paymentMethod?: string; isTaxInvoiceRequested?: boolean; taxInvoiceName?: string; taxInvoiceTaxId?: string; taxInvoiceAddress?: string }) => 
  fetchAPI('/orders', { method: 'POST', body: JSON.stringify(data) });
export const getOrders = () => fetchAPI('/orders');
export const getKdsOrders = (branchId: number) => fetchAPI(`/orders/kds?branchId=${branchId}`);
export const updateOrderStatus = (orderId: number, status: string) => fetchAPI(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// Procurement & Branches
export const getPurchaseOrders = () => fetchAPI('/purchase-orders');
export const getSuppliers = () => fetchAPI('/suppliers');
export const getBranches = () => fetchAPI('/branches');
export const getBranch = (id: number) => fetchAPI(`/branches/${id}`);

// Transfers
export const createTransfer = (data: any) => fetchAPI(`/branches/transfers`, { method: 'POST', body: JSON.stringify(data) });
export const getTransfers = (branchId: number) => fetchAPI(`/branches/${branchId}/transfers`);
export const acceptTransfer = (transferId: number) => fetchAPI(`/branches/transfers/${transferId}/accept`, { method: 'POST' });

// Customers
export const getCustomerByPhone = (phone: string) => fetchAPI(`/customers/phone/${phone}`);
export const createCustomer = (data: any) => fetchAPI('/customers', { method: 'POST', body: JSON.stringify(data) });

// Promotions
export const getPromotions = () => fetchAPI('/promotions');
export const createPromotion = (data: any) => fetchAPI('/promotions', { method: 'POST', body: JSON.stringify(data) });
export const togglePromotion = (id: number, isActive: boolean) => fetchAPI(`/promotions/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
export const validatePromotion = (code: string, subtotal: number) => fetchAPI('/promotions/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) });

// Waste
export const getWasteLogs = (branchId?: number) => fetchAPI(`/ingredients/waste/logs${branchId ? `?branchId=${branchId}` : ''}`);

// HR
export const clockIn = (branchId: number) => fetchAPI('/hr/clock-in', { method: 'POST', body: JSON.stringify({ branchId }) });
export const clockOut = () => fetchAPI('/hr/clock-out', { method: 'POST' });
export const getMyAttendance = () => fetchAPI('/hr/attendance/me');
export const getActiveClockIn = () => fetchAPI('/hr/attendance/status');

export const createShift = (data: any) => fetchAPI('/hr/shifts', { method: 'POST', body: JSON.stringify(data) });
export const getShiftsByBranch = (branchId: number) => fetchAPI(`/hr/shifts/branch/${branchId}`);
export const getMyShifts = () => fetchAPI('/hr/shifts/me');

export const generatePayrollRun = (branchId: number, month: number, year: number) => fetchAPI('/hr/payroll/generate', { method: 'POST', body: JSON.stringify({ branchId, month, year }) });
export const getPayrollRuns = (branchId: number) => fetchAPI(`/hr/payroll-runs?branchId=${branchId}`);
export const approvePayrollRun = (id: number) => fetchAPI(`/hr/payroll-runs/${id}/approve`, { method: 'PATCH' });
export const updateHourlyRate = (userId: number, hourlyRate: number) => fetchAPI(`/hr/users/${userId}/rate`, { method: 'PATCH', body: JSON.stringify({ hourlyRate }) });
export const getHrUsers = (branchId?: number) => fetchAPI(`/hr/users${branchId ? `?branchId=${branchId}` : ''}`);

// Waste & Costing
export const getBranchInventory = (branchId?: number) => fetchAPI(`/ingredients/inventory/branch${branchId ? `?branchId=${branchId}` : ''}`);

// Finance & Settlement
export const createExpense = (branchId: number, data: { amount: number; category: string; description?: string }) => fetchAPI('/finance/expenses', { method: 'POST', body: JSON.stringify({ branchId, ...data }) });
export const getExpenses = (branchId?: number, date?: string) => {
  const params = new URLSearchParams();
  if (branchId) params.append('branchId', branchId.toString());
  if (date) params.append('date', date);
  const qs = params.toString();
  return fetchAPI(`/finance/expenses${qs ? `?${qs}` : ''}`);
};
export const getExpectedCash = (branchId?: number) => fetchAPI(`/finance/settlements/expected${branchId ? `?branchId=${branchId}` : ''}`);
export const submitSettlement = (branchId: number, actualCash: number, actualCreditCard?: number, actualQR?: number) => fetchAPI('/finance/settlements', { method: 'POST', body: JSON.stringify({ branchId, actualCash, actualCreditCard, actualQR }) });
export const getSettlements = (branchId?: number) => fetchAPI(`/finance/settlements${branchId ? `?branchId=${branchId}` : ''}`);
export const approveSettlement = (id: number) => fetchAPI(`/finance/settlements/${id}/approve`, { method: 'PATCH' });

export async function addInventoryBatch(branchId: number, data: { ingredientId: number, quantity: number, expiryDate?: string }) {
  return fetchAPI(`/branches/${branchId}/batches`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function reportWaste(branchId: number, data: { batchId?: number, ingredientId: number, quantity: number, reason: string }) {
  return fetchAPI(`/branches/${branchId}/waste`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export const exportSales = async (token: string, branchId?: number, startDate?: Date, endDate?: Date) => {
  const params = new URLSearchParams()
  if (branchId) params.append('branchId', branchId.toString())
  if (startDate) params.append('startDate', startDate.toISOString())
  if (endDate) params.append('endDate', endDate.toISOString())

  const res = await fetch(`${API_URL}/finance/export/sales?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  
  if (!res.ok) throw new Error("Failed to export sales")
  
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sales-export-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// Equipment
export const getEquipment = (branchId?: number) => fetchAPI(`/equipment${branchId ? `?branchId=${branchId}` : ''}`);
export const createEquipment = (data: any) => fetchAPI('/equipment', { method: 'POST', body: JSON.stringify(data) });
export const updateEquipment = (id: number, data: any) => fetchAPI(`/equipment/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const logMaintenance = (equipmentId: number, data: any) => fetchAPI(`/equipment/${equipmentId}/maintenance`, { method: 'POST', body: JSON.stringify(data) });

// Customers
export const getCustomers = (search?: string) => fetchAPI(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);

// Reports
export const getSalesTrends = (branchId?: number) => fetchAPI(`/reports/sales-trends${branchId ? `?branchId=${branchId}` : ''}`);
export const getTopProducts = (branchId?: number) => fetchAPI(`/reports/top-products${branchId ? `?branchId=${branchId}` : ''}`);
export const getProfitLoss = (branchId?: number) => fetchAPI(`/reports/profit-loss${branchId ? `?branchId=${branchId}` : ''}`);
