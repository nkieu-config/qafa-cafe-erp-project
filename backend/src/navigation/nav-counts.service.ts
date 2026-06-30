import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { BranchScopedUser } from '../auth/branch-scope.util';
import { resolveOptionalBranchId } from '../auth/branch-scope.util';

export type NavCountsResponse = {
  branchId: number | null;
  lowStock: number;
  expiringBatches: number;
  pendingTransfers: number;
  kdsOrders: number;
  pendingPurchaseOrders: number;
  pendingSettlements: number;
  pendingLeave: number;
};

@Injectable()
export class NavCountsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNavCounts(
    user: BranchScopedUser,
    requestedBranchId?: number | null,
  ): Promise<NavCountsResponse> {
    const branchId = resolveOptionalBranchId(
      user,
      requestedBranchId ?? undefined,
    );
    const isManagerOrAdmin =
      user.role === Role.SUPER_ADMIN || user.role === Role.MANAGER;

    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 7);
    warningDate.setHours(23, 59, 59, 999);

    const [
      lowStock,
      expiringBatches,
      pendingTransfers,
      kdsOrders,
      pendingPurchaseOrders,
      pendingSettlements,
      pendingLeave,
    ] = await Promise.all([
      branchId != null ? this.countLowStock(branchId) : Promise.resolve(0),
      branchId != null
        ? this.countExpiringBatches(branchId, warningDate)
        : Promise.resolve(0),
      this.countPendingTransfers(branchId),
      branchId != null ? this.countKdsOrders(branchId) : Promise.resolve(0),
      isManagerOrAdmin
        ? this.countPendingPurchaseOrders(branchId)
        : Promise.resolve(0),
      isManagerOrAdmin
        ? this.countPendingSettlements(branchId)
        : Promise.resolve(0),
      isManagerOrAdmin ? this.countPendingLeave(branchId) : Promise.resolve(0),
    ]);

    return {
      branchId: branchId ?? null,
      lowStock,
      expiringBatches,
      pendingTransfers,
      kdsOrders,
      pendingPurchaseOrders,
      pendingSettlements,
      pendingLeave,
    };
  }

  private async countLowStock(branchId: number): Promise<number> {
    const rows = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count
      FROM "BranchInventory"
      WHERE "branchId" = ${branchId}
        AND stock <= "minStock"
    `;
    return Number(rows[0]?.count ?? 0);
  }

  private async countExpiringBatches(
    branchId: number,
    warningDate: Date,
  ): Promise<number> {
    return this.prisma.inventoryBatch.count({
      where: {
        branchId,
        quantity: { gt: 0 },
        status: { in: ['ACTIVE', 'EXPIRED'] },
        expiryDate: { not: null, lte: warningDate },
      },
    });
  }

  private async countPendingTransfers(branchId?: number): Promise<number> {
    return this.prisma.stockTransfer.count({
      where: {
        status: 'PENDING',
        ...(branchId != null ? { toBranchId: branchId } : {}),
      },
    });
  }

  private async countKdsOrders(branchId: number): Promise<number> {
    return this.prisma.order.count({
      where: {
        branchId,
        status: { in: ['PENDING', 'PREPARING'] },
      },
    });
  }

  private async countPendingPurchaseOrders(branchId?: number): Promise<number> {
    return this.prisma.purchaseOrder.count({
      where: {
        status: 'PENDING',
        ...(branchId != null ? { branchId } : {}),
      },
    });
  }

  private async countPendingSettlements(branchId?: number): Promise<number> {
    return this.prisma.shiftSettlement.count({
      where: {
        status: 'PENDING',
        ...(branchId != null ? { branchId } : {}),
      },
    });
  }

  private async countPendingLeave(branchId?: number): Promise<number> {
    return this.prisma.leaveRequest.count({
      where: {
        status: 'PENDING',
        ...(branchId != null ? { user: { branchId } } : {}),
      },
    });
  }
}
