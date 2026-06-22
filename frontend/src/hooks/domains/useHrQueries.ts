import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';

// ==========================================
// 👥 HR HOOKS
// ==========================================
export const useShifts = (role?: string, branchId?: number) => {
  return useQuery({
    queryKey: ['shifts', role, branchId],
    queryFn: () => {
      if ((role === 'SUPER_ADMIN' || role === 'MANAGER') && branchId) {
        return fetchAPI(`/hr/shifts/branch/${branchId}`);
      } else {
        return fetchAPI('/hr/shifts/me');
      }
    },
    enabled: !!role,
  });
};

export const useAttendance = () => {
  return useQuery({
    queryKey: ['attendance', 'me'],
    queryFn: () => fetchAPI('/hr/attendance/me'),
  });
};

export const useActiveClockIn = () => {
  return useQuery({
    queryKey: ['attendance', 'status'],
    queryFn: () => fetchAPI('/hr/attendance/status'),
  });
};

export const useClockIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branchId: number) => fetchAPI('/hr/clock-in', { method: 'POST', body: JSON.stringify({ branchId }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });
};

export const useClockOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetchAPI('/hr/clock-out', { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });
};

export const useHrUsers = (branchId?: number) => {
  return useQuery({
    queryKey: ['hrUsers', branchId],
    queryFn: () => fetchAPI(branchId ? `/hr/users?branchId=${branchId}` : '/hr/users'),
  });
};

export const useUpdateHourlyRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, hourlyRate }: { userId: number; hourlyRate: number }) => 
      fetchAPI(`/hr/users/${userId}/rate`, { method: 'PATCH', body: JSON.stringify({ hourlyRate }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hrUsers'] }),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetchAPI('/hr/users', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hrUsers'] }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => fetchAPI(`/hr/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hrUsers'] }),
  });
};

// ==========================================
// 👥 HR (LEAVE & PAYROLL) HOOKS
// ==========================================
export const useLeaveRequests = (branchId?: number, isManagerOrAdmin?: boolean) => {
  return useQuery({
    queryKey: ['leaveRequests', branchId, isManagerOrAdmin],
    queryFn: () => isManagerOrAdmin ? fetchAPI(branchId ? `/hr/leave?branchId=${branchId}` : '/hr/leave') : fetchAPI('/hr/leave/me'),
  });
};

export const useCreateLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => fetchAPI('/hr/leave', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaveRequests'] }),
  });
};

export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => fetchAPI(`/hr/leave/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaveRequests'] }),
  });
};

export const usePayrollRuns = (branchId?: number) => {
  return useQuery({
    queryKey: ['payrollRuns', branchId],
    queryFn: () => fetchAPI(`/hr/payroll-runs?branchId=${branchId}`),
    enabled: !!branchId,
  });
};

export const useGeneratePayrollRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { branchId: number; month: number; year: number }) => 
      fetchAPI('/hr/payroll/generate', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrollRuns'] }),
  });
};

export const useApprovePayrollRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchAPI(`/hr/payroll-runs/${id}/approve`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrollRuns'] }),
  });
};

