using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Orders.Domain;

public class RefundRequestItem : EntityBase<long>
{
    public long RefundRequestId { get; private set; }
    public long SubOrderItemId { get; private set; }
    public int QuantityToRefund { get; private set; }
    public decimal UnitPrice { get; private set; }

    private RefundRequestItem() { }

    public RefundRequestItem(long refundRequestId, long subOrderItemId, int quantityToRefund, decimal unitPrice)
    {
        RefundRequestId = refundRequestId;
        SubOrderItemId = subOrderItemId;
        QuantityToRefund = quantityToRefund;
        UnitPrice = unitPrice;
    }
}
