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
export const createOrder = (data: { userId: number; branchId: number; items: { productId: number; quantity: number }[] }) => 
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
export const getCustomers = () => fetchAPI('/customers');
export const getCustomerByPhone = (phone: string) => fetchAPI(`/customers/phone/${phone}`);
export const createCustomer = (data: any) => fetchAPI('/customers', { method: 'POST', body: JSON.stringify(data) });

// Promotions
export const getPromotions = () => fetchAPI('/promotions');
export const createPromotion = (data: any) => fetchAPI('/promotions', { method: 'POST', body: JSON.stringify(data) });
export const togglePromotion = (id: number, isActive: boolean) => fetchAPI(`/promotions/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
export const validatePromotion = (code: string, subtotal: number) => fetchAPI('/promotions/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) });

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
export const getBranchInventory = () => fetchAPI('/ingredients/inventory/branch');
export const recordWaste = (data: { ingredientId: number; quantity: number; reason: string }) => fetchAPI('/ingredients/waste', { method: 'POST', body: JSON.stringify(data) });
export const getWasteLogs = () => fetchAPI('/ingredients/waste/logs');

// Finance & Settlement
export const createExpense = (data: { amount: number; category: string; description?: string }) => fetchAPI('/finance/expenses', { method: 'POST', body: JSON.stringify(data) });
export const getExpenses = (date?: string) => fetchAPI(`/finance/expenses${date ? `?date=${date}` : ''}`);
export const getExpectedCash = () => fetchAPI('/finance/settlements/expected');
export const submitSettlement = (actualCash: number) => fetchAPI('/finance/settlements', { method: 'POST', body: JSON.stringify({ actualCash }) });
export const getSettlements = () => fetchAPI('/finance/settlements');
export const approveSettlement = (id: number) => fetchAPI(`/finance/settlements/${id}/approve`, { method: 'PATCH' });
