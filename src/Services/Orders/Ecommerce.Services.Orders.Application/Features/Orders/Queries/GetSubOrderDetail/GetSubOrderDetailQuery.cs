using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Payments;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Users;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetSubOrderDetail;

public class SubOrderDetailDto
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long Id { get; set; }
    public long CustomerId { get; set; }
    public long ShopId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public string? ShopLogoUrl { get; set; }
    public decimal SubTotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal SellerDiscount { get; set; }
    public decimal PlatformDiscount { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal CommissionRate { get; set; }
    public long CommissionFee { get; set; }
    public long NetRevenue { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsOnlinePayment { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? DeliveredDate { get; set; }
    
    // User details aggregated from Identity service
    public UserDetailDto? User { get; set; }
    
    // Shipping Address info (constructed from Order parent properties)
    public UserAddressDto? ShippingAddress { get; set; }
    
    // Payment Method details aggregated from Payments service
    public PaymentDto? PaymentDto { get; set; }
    
    // Voucher details
    public string? ShopVoucherCode { get; set; }
    public string? PlatformVoucherCode { get; set; }
    
    // Items
    public List<CustomerOrderItemDto> OrderItems { get; set; } = new();
}

public record GetSubOrderDetailQuery(long SubOrderId, long UserId, bool IsSeller, bool IsAdmin = false) : IQuery<SubOrderDetailDto>;
