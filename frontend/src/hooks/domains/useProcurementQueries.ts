import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/lib/endpoints';
import { fetchAPI } from '@/lib/api';
import { NAV_COUNTS_QUERY_KEY } from '@/lib/nav-counts';

// ==========================================
// 🛒 PROCUREMENT HOOKS
// ==========================================
export const usePurchaseOrders = () => {
  return useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => fetchAPI(API_ENDPOINTS.procurement.purchaseOrders),
  });
};

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: () => fetchAPI(API_ENDPOINTS.procurement.suppliers),
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => fetchAPI(API_ENDPOINTS.procurement.createPurchaseOrder, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
    },
  });
};

export const useSubmitPurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchAPI(API_ENDPOINTS.procurement.submitPurchaseOrder(id), {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
    },
  });
};

export const useApprovePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchAPI(API_ENDPOINTS.procurement.approvePurchaseOrder(id), { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
    },
  });
};

export const useRejectPurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchAPI(API_ENDPOINTS.procurement.rejectPurchaseOrder(id), { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
    },
  });
};

export const useReceivePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      items,
    }: {
      id: number;
      items?: { ingredientId: number; expiryDate?: string }[];
    }) =>
      fetchAPI(API_ENDPOINTS.procurement.receivePurchaseOrder(id), {
        method: 'POST',
        body: JSON.stringify(items?.length ? { items } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['branchDetails'] });
      queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
    },
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; contactEmail?: string; phone?: string }) =>
      fetchAPI(API_ENDPOINTS.procurement.createSupplier, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      contactEmail?: string;
      phone?: string;
    }) =>
      fetchAPI(API_ENDPOINTS.procurement.updateSupplier(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchAPI(API_ENDPOINTS.procurement.deleteSupplier(id), { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
};

export {
  useTransfers,
  useCreateTransfer,
  useAcceptTransfer,
} from './useTransferQueries';

export const useEquipment = (branchId?: number) => {
  return useQuery({
    queryKey: ['equipment', branchId],
    queryFn: () => fetchAPI(API_ENDPOINTS.equipment.list(branchId)),
  });
};

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { branchId: number } & Record<string, unknown>) =>
      fetchAPI(API_ENDPOINTS.equipment.create, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['equipment', variables.branchId] }),
  });
};

export const useLogMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: unknown }) => fetchAPI(API_ENDPOINTS.equipment.maintenance(id), { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment'] }),
  });
};

