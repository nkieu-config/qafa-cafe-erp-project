import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';

// ==========================================
// 💰 ACCOUNTING HOOKS
// ==========================================
export const useLedger = (branchId?: string) => {
  return useQuery({
    queryKey: ['ledger', branchId],
    queryFn: () => fetchAPI(branchId && branchId !== "ALL" ? `/accounting/profit-loss?branchId=${branchId}` : '/accounting/profit-loss'),
  });
};

export const useJournalEntries = (branchId?: string) => {
  return useQuery({
    queryKey: ['journalEntries', branchId],
    queryFn: () => fetchAPI(branchId && branchId !== "ALL" ? `/accounting/journal-entries?branchId=${branchId}` : '/accounting/journal-entries'),
  });
};

export const useAccounts = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => fetchAPI('/accounts'),
  });
};


export const useProductionBOMs = () => {
  return useQuery({
    queryKey: ['productionBOMs'],
    queryFn: () => fetchAPI('/production/boms'),
  });
};

export const useCreateProductionBOM = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => fetchAPI('/production/boms', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productionBOMs'] }),
  });
};

