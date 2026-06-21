import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
  branchId: number | null;
}

export interface RequestWithUser extends Request {
  user: {
    userId: number;
    email: string;
    role: Role;
    branchId: number | null;
  };
}
