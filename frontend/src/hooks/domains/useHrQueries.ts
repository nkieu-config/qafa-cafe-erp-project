import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/lib/endpoints';
import { fetchAPI } from '@/lib/api';
import type { CreateUserPayload, UpdateUserPayload } from '@/types/api';

// ==========================================
// 👥 HR HOOKS
// ==========================================
export const useShifts = (role?: string, branchId?: number) => {
  return useQuery({
    queryKey: ['shifts', role, branchId],
    queryFn: () => {
      if ((role === 'SUPER_ADMIN' || role === 'MANAGER') && branchId) {
        return fetchAPI(API_ENDPOINTS.hr.shiftsByBranch(branchId));
      } else {
        return fetchAPI(API_ENDPOINTS.hr.shiftsMe);
      }
    },
    enabled: !!role,
  });
};

export const useAttendance = () => {
  return useQuery({
    queryKey: ['attendance', 'me'],
    queryFn: () => fetchAPI(API_ENDPOINTS.hr.attendanceMe),
  });
};

export const useActiveClockIn = (enabled = true) => {
  return useQuery({
    queryKey: ['attendance', 'status'],
    queryFn: () => fetchAPI(API_ENDPOINTS.hr.attendanceStatus),
    enabled,
  });
};

export const useClockIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branchId: number) => fetchAPI(API_ENDPOINTS.hr.clockIn, { method: 'POST', body: JSON.stringify({ branchId }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });
};

export const useClockOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetchAPI(API_ENDPOINTS.hr.clockOut, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });
};

export const useHrUsers = (branchId?: number) => {
  return useQuery({
    queryKey: ['hrUsers', branchId],
    queryFn: () => fetchAPI(API_ENDPOINTS.hr.users(branchId)),
  });
};

export const useUpdateHourlyRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, hourlyRate }: { userId: number; hourlyRate: number }) => 
      fetchAPI(API_ENDPOINTS.hr.updateHourlyRate(userId), { method: 'PATCH', body: JSON.stringify({ hourlyRate }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hrUsers'] }),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserPayload) => fetchAPI(API_ENDPOINTS.hr.createUser, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hrUsers'] }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateUserPayload) => fetchAPI(API_ENDPOINTS.hr.updateUser(id), { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hrUsers'] }),
  });
};

// ==========================================
// 👥 HR (LEAVE & PAYROLL) HOOKS
// ==========================================
export const useLeaveRequests = (branchId?: number, isManagerOrAdmin?: boolean) => {
  return useQuery({
    queryKey: ['leaveRequests', branchId, isManagerOrAdmin],
    queryFn: () => isManagerOrAdmin ? fetchAPI(API_ENDPOINTS.hr.leave(branchId)) : fetchAPI(API_ENDPOINTS.hr.leaveMe),
  });
};

export const useCreateLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => fetchAPI(API_ENDPOINTS.hr.createLeave, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaveRequests'] }),
  });
};

export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => fetchAPI(API_ENDPOINTS.hr.updateLeaveStatus(id), { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaveRequests'] }),
  });
};

export const usePayrollRuns = (branchId?: number) => {
  return useQuery({
    queryKey: ['payrollRuns', branchId],
    queryFn: () => fetchAPI(API_ENDPOINTS.hr.payrollRuns(branchId!)),
    enabled: !!branchId,
  });
};

export const useGeneratePayrollRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { branchId: number; month: number; year: number }) => 
      fetchAPI(API_ENDPOINTS.hr.generatePayroll, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrollRuns'] }),
  });
};

export const useApprovePayrollRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchAPI(API_ENDPOINTS.hr.approvePayrollRun(id), { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrollRuns'] }),
  });
};

