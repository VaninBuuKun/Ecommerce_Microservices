using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using BuildingBlocks.Shared.Domains;
using BuildingBlocks.Shared.Domains.Interfaces;
using Ecommerce.Services.Orders.Domain.Rules;
using MediatR;

namespace Ecommerce.Services.Orders.Domain;

public sealed class Order : AggregateRoot<long>, IDateTracking
{   
    public long CustomerId { get; private set; }
    public ICollection<SubOrder> SubOrderItems { get; private set; } = new List<SubOrder>();

    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? LastModifiedDate { get; set; }
    
    public long SubTotal { get; private set; } //Tính theo sum(unitprice * quantity)
    public long ShippingFee { get; private set; }
    public long TotalDiscount { get; private set; }
    public long GrandTotal { get; private set; }
    
    public string ShippingAddress { get; private set; } = string.Empty; //Địa điểm giao
    public string RecipientName { get; private set; } = string.Empty;
    public string RecipientPhone { get; private set; } = string.Empty;
    public long RecipientWardId { get; private set; }
    
    public IReadOnlyCollection<SubOrder> GetSubOrders() => SubOrderItems.ToList().AsReadOnly();
    
    
    private Order() {}
    
    [NotMapped]
    public bool IsOnlinePayment { get; private set; } //Xác định hình thức thanh toán, true: online, false: offline

    public Order(long id, long customerId, string shippingAddress, bool isOnlinePayment, string recipientName, string recipientPhone, long recipientWardId)
    {
        Id = id;
        CustomerId = customerId;
        ShippingAddress = shippingAddress;
        RecipientName = recipientName;
        RecipientPhone = recipientPhone;
        RecipientWardId = recipientWardId;
        IsOnlinePayment = isOnlinePayment;
        CreatedDate = DateTimeOffset.UtcNow;
    }

    public Order(long customerId, string shippingAddress, bool isOnlinePayment, string recipientName, string recipientPhone, long recipientWardId)
        : this(0, customerId, shippingAddress, isOnlinePayment, recipientName, recipientPhone, recipientWardId)
    {
    }

    public void AddOrderItem(
        long subOrderId,
        long shopId,
        long productId,
        long variantId,
        string productName,
        string variantName,
        decimal unitPrice,
        int quantity,
        string? thumbnailUrl = null,
        long? subOrderItemId = null,
        double weightInGrams = 0,
        double length = 0,
        double width = 0,
        double height = 0)
    {
        var existingShopSubOrder = SubOrderItems.FirstOrDefault(x => x.ShopId == shopId);

        if (existingShopSubOrder == null)
        {
            existingShopSubOrder = new SubOrder(subOrderId, Id, CustomerId, shopId, IsOnlinePayment);
            SubOrderItems.Add(existingShopSubOrder);
        }

        var item = new SubOrderItem(variantId, productName, variantName, unitPrice, quantity, thumbnailUrl, weightInGrams, length, width, height);
        if (subOrderItemId.HasValue && subOrderItemId.Value > 0)
        {
            item.Id = subOrderItemId.Value;
        }
        item.ProductId = productId;
        item.SubOrderId = existingShopSubOrder.Id;
        existingShopSubOrder.AddOrderItem(item);

        CalculateTotals();
    }

    public void SetShippingFee(long shopId, long shippingFee)
    {
        var existingShopSubOrder = SubOrderItems.FirstOrDefault(x => x.ShopId == shopId);
        existingShopSubOrder?.SetShippingFee(shippingFee);

        CalculateTotals();
    }

    public void ApplyDiscounts(long shopId, long sellerDiscount, long platformDiscount)
    {
        var existingShopSubOrder = SubOrderItems.FirstOrDefault(x => x.ShopId == shopId);
        existingShopSubOrder?.SetDiscounts(sellerDiscount, platformDiscount);

        CalculateTotals();
    }

    public void ApplyVoucherIds(long shopId, long? shopVoucherId, long? platformVoucherId)
    {
        var existingShopSubOrder = SubOrderItems.FirstOrDefault(x => x.ShopId == shopId);
        existingShopSubOrder?.ApplyVouchers(shopVoucherId, platformVoucherId);
    }

    private void CalculateTotals()
    {
        SubTotal = SubOrderItems.Sum(x => x.SubTotal);
        ShippingFee = SubOrderItems.Sum(x => x.ShippingFee);
        TotalDiscount = SubOrderItems.Sum(x => x.SellerDiscount + x.PlatformDiscount);
        GrandTotal = SubOrderItems.Sum(x => x.GrandTotal);
    }
}
