import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/lib/endpoints';
import { fetchAPI } from '@/lib/api';
import { NAV_COUNTS_QUERY_KEY } from '@/lib/nav-counts';
import type { CreateTransferDTO } from '@/types/schemas';

export const useTransfers = (branchId?: number) => {
  return useQuery({
    queryKey: ['transfers', branchId ?? 'all'],
    queryFn: () =>
      fetchAPI(
        branchId
          ? API_ENDPOINTS.branches.transfers(branchId)
          : API_ENDPOINTS.branches.transfersAll,
      ),
  });
};

export const useCreateTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransferDTO) =>
      fetchAPI(API_ENDPOINTS.branches.createTransfer, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['branch'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balance'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsSummary'] });
      queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
    },
  });
};

export const useAcceptTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transferId: number) =>
      fetchAPI(API_ENDPOINTS.branches.acceptTransfer(transferId), {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['branch'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balance'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsSummary'] });
      queryClient.invalidateQueries({ queryKey: [NAV_COUNTS_QUERY_KEY] });
    },
  });
};
