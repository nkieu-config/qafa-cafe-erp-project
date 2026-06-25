export class ProductionCompletedEvent {
  constructor(
    public readonly orderNumber: string,
    public readonly targetIngredientName: string,
    public readonly branchId: number,
    public readonly totalRawCost: number,
  ) {}
}
