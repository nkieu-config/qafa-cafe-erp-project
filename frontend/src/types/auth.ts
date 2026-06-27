export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  branchId: number | null;
  branch: string | null;
};
