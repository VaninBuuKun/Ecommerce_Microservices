using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Domain;

public class SubOrder : EntityTrackingBase<Guid>
{
    public Guid OrderId { get; set; }
    public long CustomerId { get; private set; }
    public long ShopId { get; private set; }
    
    public long SubTotal { get; private set; } //Tính theo sum(unitprice * quantity)
    public long ShippingFee { get; private set; }
    public long SellerDiscount { get; private set; } //Theo voucher
    public long PlatformDiscount { get; private set; } //Theo sàn
    public long GrandTotal { get; private set; }
    
    // Truy vết voucher đã áp dụng để hỗ trợ rollback khi hủy đơn
    public Guid? ShopVoucherId { get; private set; }
    public Guid? PlatformVoucherId { get; private set; }
    
    public SubOrderStatus Status { get; private set; }
    public bool IsOnlinePayment { get; private set; }
    public ICollection<SubOrderItem> SubOrderItems { get; set; } = new List<SubOrderItem>();

    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? LastModifiedDate { get; set; }
    public DateTimeOffset? DeliveredDate { get; set; }
    
    public Order Order { get; private set; }

    private SubOrder() {}
    
    public SubOrder(long customerId, long shopId, bool isOnlinePayment)
    {
        Id = Guid.NewGuid();
        CustomerId = customerId;
        ShopId = shopId;
        IsOnlinePayment = isOnlinePayment;

        Status = isOnlinePayment ? SubOrderStatus.AwaitingPayment : SubOrderStatus.AwaitingConfirmation;
    }

    public void AddOrderItem(SubOrderItem subOrderItem)
    {
        var existingItem = SubOrderItems.SingleOrDefault(item => item.VariantId == subOrderItem.VariantId);

        if (existingItem != null)
        {
            throw new InvalidOperationException($"Order item with variant ID {subOrderItem.VariantId} already exists in the sub-order.");
        }
        
        SubOrderItems.Add(subOrderItem);

        CalculateSubTotal();
        CalculateGrandTotal();
    }

    public void SetShippingFee(long shippingFee)
    {
        ShippingFee = shippingFee;
        CalculateGrandTotal();
    }

    public void SetDiscounts(long sellerDiscount, long platformDiscount)
    {
        SellerDiscount = sellerDiscount;
        PlatformDiscount = platformDiscount;
        CalculateGrandTotal();
    }

    /// <summary>
    /// Gắn ID voucher đã áp dụng vào SubOrder để hỗ trợ rollback khi hủy đơn.
    /// </summary>
    public void ApplyVouchers(Guid? shopVoucherId, Guid? platformVoucherId)
    {
        if (shopVoucherId.HasValue)
            ShopVoucherId = shopVoucherId;
        if (platformVoucherId.HasValue)
            PlatformVoucherId = platformVoucherId;
    }

    // ========== Status Transition Rules ==========
    
    private static readonly Dictionary<SubOrderStatus, HashSet<SubOrderStatus>> AllowedTransitions = new()
    {
        [SubOrderStatus.AwaitingPayment] = new() { SubOrderStatus.AwaitingConfirmation, SubOrderStatus.Cancelled },
        [SubOrderStatus.AwaitingConfirmation] = new() { SubOrderStatus.Processing, SubOrderStatus.Cancelled },
        [SubOrderStatus.Processing] = new() { SubOrderStatus.PackageReady, SubOrderStatus.Cancelled },
        [SubOrderStatus.PackageReady] = new() {SubOrderStatus.Shipping, SubOrderStatus.Cancelled },
        [SubOrderStatus.Shipping] = new() { SubOrderStatus.Delivered },
        [SubOrderStatus.Delivered] = new() { SubOrderStatus.Returning, SubOrderStatus.Completed },
        [SubOrderStatus.Returning] = new() { SubOrderStatus.Refunded, SubOrderStatus.Delivered },
        [SubOrderStatus.Refunded] = new(),
        [SubOrderStatus.Completed] = new(),
        [SubOrderStatus.Cancelled] = new(),
    };

    public void UpdateSubOrderStatus(SubOrderStatus newStatus)
    {
        if (Status == newStatus) return;

        if (!AllowedTransitions.TryGetValue(Status, out var allowed) || !allowed.Contains(newStatus))
        {
            throw new InvalidOperationException(
                $"Không thể chuyển trạng thái đơn hàng từ '{Status}' sang '{newStatus}'. " +
                $"Các trạng thái hợp lệ: [{string.Join(", ", allowed ?? new HashSet<SubOrderStatus>())}]");
        }

        if (newStatus == SubOrderStatus.Delivered)
        {
            DeliveredDate = DateTimeOffset.UtcNow;
        }

        Status = newStatus;
    }
    
    private void CalculateSubTotal() 
    {
        SubTotal = (long)SubOrderItems.Sum(item => item.Quantity * item.UnitPrice);
    }

    private void CalculateGrandTotal() 
    {
        GrandTotal = SubTotal + ShippingFee - SellerDiscount - PlatformDiscount;
    }
}