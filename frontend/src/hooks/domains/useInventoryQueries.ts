import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/lib/endpoints';
import { fetchAPI } from '@/lib/api';
import { NAV_COUNTS_QUERY_KEY } from '@/lib/nav-counts';

// ==========================================
// 📦 INVENTORY HOOKS
// ==========================================
export const useBranchDetails = (branchId?: number) => {
  return useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => fetchAPI(API_ENDPOINTS.branches.detail(branchId!)),
    enabled: !!branchId,
  });
};

// Re-export transfer hooks from canonical module
export {
  useTransfers,
  useCreateTransfer,
  useAcceptTransfer,
} from './useTransferQueries';

export const useAddInventoryBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, data }: { branchId: number, data: unknown }) => fetchAPI(API_ENDPOINTS.branches.addBatch(branchId), { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branch', variables.branchId] });
      queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
    },
  });
};

export const useWasteLogs = (branchId?: number) => {
  return useQuery({
    queryKey: ['wasteLogs', branchId],
    queryFn: () => fetchAPI(API_ENDPOINTS.ingredients.wasteLogs(branchId)),
    enabled: !!branchId,
  });
};

export const useReportWaste = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, data }: { branchId: number, data: unknown }) => fetchAPI(API_ENDPOINTS.branches.reportWaste(branchId), { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wasteLogs', variables.branchId] });
      queryClient.invalidateQueries({ queryKey: ['branch', variables.branchId] });
      queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
    },
  });
};

// ==========================================
// 🚀 NEW INVENTORY MODULE HOOKS (PHASE 2)
// ==========================================
export function useBranchInventory(branchId?: number) {
  return useQuery({
    queryKey: ["inventory-balance", branchId],
    queryFn: () => fetchAPI(API_ENDPOINTS.inventory.balance(branchId!)),
    enabled: !!branchId,
  });
}

export function useStockIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { branchId: number; items: { ingredientId: number; quantity: number; expiryDate?: string }[] }) =>
      fetchAPI(API_ENDPOINTS.inventory.stockIn(data.branchId), {
        method: "POST",
        body: JSON.stringify({ items: data.items }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-balance", variables.branchId] });
      queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
    },
  });
}

export function useRecordWaste() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { branchId: number; items: { ingredientId: number; quantity: number; reason: string }[] }) =>
      fetchAPI(API_ENDPOINTS.inventory.waste(data.branchId), {
        method: "POST",
        body: JSON.stringify({ items: data.items }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-balance", variables.branchId] });
      queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["wasteLogs", variables.branchId] });
      queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
    },
  });
}
