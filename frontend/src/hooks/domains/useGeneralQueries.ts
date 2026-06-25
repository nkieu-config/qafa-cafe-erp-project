import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';

// ==========================================
// 🌍 GENERAL HOOKS
// ==========================================
export const useBranches = (enabled = true) => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => fetchAPI('/branches'),
    staleTime: Infinity, // Branches rarely change
    enabled,
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; location?: string; isCentralKitchen?: boolean }) => fetchAPI('/branches', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; location?: string; isCentralKitchen?: boolean }) => fetchAPI(`/branches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  });
};

