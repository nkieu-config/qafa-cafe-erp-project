import { Order } from '@prisma/client';

export class OrderCreatedEvent {
  constructor(
    public readonly order: Order,
    public readonly ingredientRequirements: Map<number, number>,
    public readonly branchId: number,
    public readonly customerId: number | null,
  ) {}
}
