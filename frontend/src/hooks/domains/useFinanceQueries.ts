import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';

// ==========================================
// 💸 FINANCE & SETTLEMENT HOOKS
// ==========================================
export const useFinanceSettlements = (branchId?: number) => {
  return useQuery({
    queryKey: ['financeSettlements', branchId],
    queryFn: () => fetchAPI(branchId ? `/finance/settlements?branchId=${branchId}` : '/finance/settlements'),
  });
};

export const useFinanceExpenses = (branchId?: number) => {
  return useQuery({
    queryKey: ['financeExpenses', branchId],
    queryFn: () => fetchAPI(branchId ? `/finance/expenses?branchId=${branchId}` : '/finance/expenses'),
  });
};

export const useApproveSettlement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchAPI(`/finance/settlements/${id}/approve`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financeSettlements'] }),
  });
};

export const useExpectedCash = (branchId?: number) => {
  return useQuery({
    queryKey: ['expectedCash', branchId],
    queryFn: () => fetchAPI(`/finance/settlements/expected?branchId=${branchId}`),
    enabled: !!branchId,
  });
};

export const useSubmitSettlement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { branchId: number; actualCash: number; actualCreditCard: number; actualQR: number }) => 
      fetchAPI('/finance/settlements', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financeSettlements'] }),
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { branchId: number; amount: number; category: string; description?: string }) => 
      fetchAPI('/finance/expenses', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financeExpenses'] }),
  });
};

