import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(
    userId: number,
    action: string,
    targetType: string,
    targetId?: number,
    details?: string | any,
  ) {
    const detailsString = typeof details === 'object' ? JSON.stringify(details) : details;
    
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        details: detailsString,
      },
    });
  }

  async getLogs(limit = 100, offset = 0, branchId?: number) {
    return this.prisma.auditLog.findMany({
      take: limit,
      skip: offset,
      where: branchId ? { user: { branchId } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
  }
}
