import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/lib/endpoints';
import { fetchAPI } from '@/lib/api';
import type { Order, OrderStatus } from '@/types/api';
import { KDS_STATUSES, mergeKdsOrders, normalizeKdsOrders } from '@/lib/kds-utils';

export const kdsOrdersQueryKey = (branchId?: number) => ['kdsOrders', branchId] as const;

export const useKdsOrders = (branchId?: number, isConnected = false) => {
  return useQuery({
    queryKey: kdsOrdersQueryKey(branchId),
    queryFn: () => fetchAPI(API_ENDPOINTS.orders.kds(branchId!)),
    enabled: !!branchId,
    refetchInterval: isConnected ? false : 30_000,
    select: normalizeKdsOrders,
  });
};

export const useUpdateKdsOrderStatus = (branchId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      fetchAPI(API_ENDPOINTS.orders.updateStatus(orderId), {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onMutate: async ({ orderId, status }) => {
      if (!branchId) return;
      await queryClient.cancelQueries({ queryKey: kdsOrdersQueryKey(branchId) });
      const previous = queryClient.getQueryData<Order[]>(kdsOrdersQueryKey(branchId));

      queryClient.setQueryData<Order[]>(kdsOrdersQueryKey(branchId), (old) => {
        const current = normalizeKdsOrders(old);
        if (status === 'COMPLETED' || !KDS_STATUSES.includes(status as OrderStatus)) {
          return current.filter((o) => o.id !== orderId);
        }
        return mergeKdsOrders(
          current.map((o) => (o.id === orderId ? { ...o, status: status as OrderStatus } : o)),
          [],
        );
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (branchId && context?.previous) {
        queryClient.setQueryData(kdsOrdersQueryKey(branchId), context.previous);
      }
    },
    onSettled: () => {
      if (branchId) {
        queryClient.invalidateQueries({ queryKey: kdsOrdersQueryKey(branchId) });
      }
    },
  });
};

// ==========================================
// 🛒 POS HOOKS
// ==========================================
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => fetchAPI(API_ENDPOINTS.products.list),
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => fetchAPI(API_ENDPOINTS.orders.create, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useBranchOrders = (branchId?: number) => {
  return useQuery({
    queryKey: ['orders', branchId],
    queryFn: () => fetchAPI(API_ENDPOINTS.orders.list(branchId)),
    enabled: !!branchId,
  });
};

export const useVoidOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) =>
      fetchAPI(API_ENDPOINTS.orders.void(orderId), { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['salesTrends'] });
      queryClient.invalidateQueries({ queryKey: ['branchInventory'] });
    },
  });
};

export const useRefundOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason?: string }) =>
      fetchAPI(API_ENDPOINTS.orders.refund(orderId), {
        method: 'POST',
        body: JSON.stringify(reason ? { reason } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['salesTrends'] });
      queryClient.invalidateQueries({ queryKey: ['branchInventory'] });
    },
  });
};

export const useValidatePromotion = () => {
  return useMutation({
    mutationFn: ({ code, subtotal }: { code: string, subtotal: number }) => fetchAPI(API_ENDPOINTS.promotions.validate, { method: 'POST', body: JSON.stringify({ code, subtotal }) }),
  });
};

export const useCustomerByPhone = () => {
  return useMutation({
    mutationFn: (phone: string) => fetchAPI(API_ENDPOINTS.customers.byPhone(phone)),
  });
};

