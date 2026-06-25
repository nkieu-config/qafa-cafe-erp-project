export class PurchaseOrderReceivedEvent {
  constructor(
    public readonly poId: number,
    public readonly poNumber: string,
    public readonly branchId: number,
    public readonly totalAmount: number,
  ) {}
}
