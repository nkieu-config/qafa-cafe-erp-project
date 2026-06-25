import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';

// ==========================================
// 📦 INVENTORY HOOKS
// ==========================================
export const useBranchDetails = (branchId?: number) => {
  return useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => fetchAPI(`/branches/${branchId}`),
    enabled: !!branchId,
  });
};

export const useTransfers = (branchId?: number) => {
  return useQuery({
    queryKey: ['transfers', branchId],
    queryFn: () => fetchAPI(`/branches/${branchId}/transfers`),
    enabled: !!branchId,
  });
};

export const useCreateTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => fetchAPI(`/branches/transfers`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['transfers', variables.fromBranchId] });
      queryClient.invalidateQueries({ queryKey: ['branch', variables.fromBranchId] });
    },
  });
};

export const useAcceptTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transferId, branchId }: { transferId: number, branchId: number }) => fetchAPI(`/branches/transfers/${transferId}/accept`, { method: 'POST' }),
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['transfers', variables.branchId] });
      queryClient.invalidateQueries({ queryKey: ['branch', variables.branchId] });
    },
  });
};

export const useAddInventoryBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, data }: { branchId: number, data: unknown }) => fetchAPI(`/branches/${branchId}/batches`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['branch', variables.branchId] });
    },
  });
};

export const useWasteLogs = (branchId?: number) => {
  return useQuery({
    queryKey: ['wasteLogs', branchId],
    queryFn: () => fetchAPI(`/ingredients/waste/logs${branchId ? `?branchId=${branchId}` : ''}`),
    enabled: !!branchId,
  });
};

export const useReportWaste = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, data }: { branchId: number, data: unknown }) => fetchAPI(`/branches/${branchId}/waste`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['wasteLogs', variables.branchId] });
      queryClient.invalidateQueries({ queryKey: ['branch', variables.branchId] });
    },
  });
};

// ==========================================
// 🚀 NEW INVENTORY MODULE HOOKS (PHASE 2)
// ==========================================
export function useBranchInventory(branchId?: number) {
  return useQuery({
    queryKey: ["inventory-balance", branchId],
    queryFn: () => fetchAPI(`/inventory/branch/${branchId}/balance`),
    enabled: !!branchId,
  });
}

export function useStockIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { branchId: number; items: { ingredientId: number; quantity: number; expiryDate?: string }[] }) =>
      fetchAPI(`/inventory/branch/${data.branchId}/stock-in`, {
        method: "POST",
        body: JSON.stringify({ items: data.items }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-balance", variables.branchId] });
    },
  });
}

export function useRecordWaste() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { branchId: number; items: { ingredientId: number; quantity: number; reason: string }[] }) =>
      fetchAPI(`/inventory/branch/${data.branchId}/waste`, {
        method: "POST",
        body: JSON.stringify({ items: data.items }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-balance", variables.branchId] });
      queryClient.invalidateQueries({ queryKey: ["wasteLogs", variables.branchId] });
    },
  });
}
