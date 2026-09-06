using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Payments;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Users;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Domain;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetSubOrderDetail;

public class SubOrderDetailDto
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long Id { get; set; }
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long OrderId { get; set; }
    public long CustomerId { get; set; }
    public long ShopId { get; set; }
    public decimal SubTotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal SellerDiscount { get; set; }
    public decimal PlatformDiscount { get; set; }
    public decimal GrandTotal { get; set; }
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

public class GetSubOrderDetailQueryHandler(
    IEfUnitOfWork unitOfWork,
    IIdentityService identityService,
    IPaymentService paymentService,
    ISellerService sellerService,
    ILogger<GetSubOrderDetailQueryHandler> logger)
    : IQueryHandler<GetSubOrderDetailQuery, SubOrderDetailDto>
{
    public async Task<Result<SubOrderDetailDto>> Handle(GetSubOrderDetailQuery request, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Getting detailed sub-order {SubOrderId} (IsAdmin: {IsAdmin}, IsSeller: {IsSeller})", 
                request.SubOrderId, request.IsAdmin, request.IsSeller);

            var subOrderRepo = unitOfWork.Repository<SubOrder, long>();
            var subOrder = await subOrderRepo.FirstOrDefaultAsync(
                predicate: o => o.Id == request.SubOrderId,
                includes: [o => o.SubOrderItems, o => o.Order]
            );

            if (subOrder == null)
            {
                return Result<SubOrderDetailDto>.Failure("Đơn hàng không tồn tại", EErrorCode.NotFound);
            }

            // Authorization Check: Admin bypasses ownership restrictions
            if (request.IsAdmin)
            {
                logger.LogInformation("Admin access granted for sub-order {SubOrderId}", request.SubOrderId);
            }
            else if (request.IsSeller)
            {
                var validationResult = await sellerService.ValidateShopOwnerAsync(subOrder.ShopId, request.UserId, cancellationToken);
                if (!validationResult.IsSuccess || !validationResult.Value)
                {
                    return Result<SubOrderDetailDto>.Failure("Bạn không có quyền truy cập đơn hàng này", EErrorCode.Forbidden);
                }
            }
            else
            {
                if (subOrder.CustomerId != request.UserId)
                {
                    return Result<SubOrderDetailDto>.Failure("Bạn không có quyền truy cập đơn hàng này", EErrorCode.Forbidden);
                }
            }


            // Aggregate user details and payment method details in parallel using Task.WhenAll
            var userTask = identityService.GetUserAsync(subOrder.CustomerId);
            var paymentTask = paymentService.GetPaymentByOrderAsync(subOrder.OrderId, cancellationToken);

            await Task.WhenAll(userTask, paymentTask);

            var userResult = await userTask;
            var paymentResult = await paymentTask;

            // Query Voucher codes if voucher IDs exist on SubOrder
            string? shopVoucherCode = null;
            string? platformVoucherCode = null;
            var voucherRepo = unitOfWork.Repository<Voucher, long>();
            
            var voucherIds = new List<long>();
            if (subOrder.ShopVoucherId.HasValue) voucherIds.Add(subOrder.ShopVoucherId.Value);
            if (subOrder.PlatformVoucherId.HasValue) voucherIds.Add(subOrder.PlatformVoucherId.Value);

            if (voucherIds.Count > 0)
            {
                var vouchers = await voucherRepo.GetAllAsync(v => voucherIds.Contains(v.Id), cancellationToken: cancellationToken);
                shopVoucherCode = vouchers.FirstOrDefault(v => v.Id == subOrder.ShopVoucherId)?.Code;
                platformVoucherCode = vouchers.FirstOrDefault(v => v.Id == subOrder.PlatformVoucherId)?.Code;
            }

            var dto = new SubOrderDetailDto
            {
                Id = subOrder.Id,
                OrderId = subOrder.OrderId,
                CustomerId = subOrder.CustomerId,
                ShopId = subOrder.ShopId,
                SubTotal = subOrder.SubTotal,
                ShippingFee = subOrder.ShippingFee,
                SellerDiscount = subOrder.SellerDiscount,
                PlatformDiscount = subOrder.PlatformDiscount,
                GrandTotal = subOrder.GrandTotal,
                Status = subOrder.Status.ToString(),
                IsOnlinePayment = subOrder.IsOnlinePayment,
                CreatedDate = subOrder.CreatedDate,
                DeliveredDate = subOrder.DeliveredDate,
                
                ShopVoucherCode = shopVoucherCode,
                PlatformVoucherCode = platformVoucherCode,

                // Aggregated user details
                User = userResult.IsSuccess ? userResult.Value : null,
                
                // Aggregated payment method details
                PaymentDto = paymentResult.IsSuccess ? paymentResult.Value : null,
                
                // Map shipping address from order details
                ShippingAddress = new UserAddressDto
                {
                    Id = Guid.Empty.ToString(),
                    UserId = subOrder.CustomerId,
                    RecipientName = subOrder.Order.RecipientName,
                    Phone = subOrder.Order.RecipientPhone,
                    WardId = subOrder.Order.RecipientWardId,
                    AddressLine = subOrder.Order.ShippingAddress
                },

                // Items list
                OrderItems = subOrder.SubOrderItems.Select(item => new CustomerOrderItemDto
                {
                    VariantId = item.VariantId,
                    ProductName = item.ProductName,
                    VariantName = item.VariantName,
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity,
                    ThumbnailUrl = item.ThumbnailUrl,
                    WeightInGrams = item.WeightInGrams,
                    Length = item.Length,
                    Width = item.Width,
                    Height = item.Height
                }).ToList()
            };

            return Result<SubOrderDetailDto>.Success(dto);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GetSubOrderDetailQuery: Lỗi khi lấy chi tiết đơn hàng con: {SubOrderId}", request.SubOrderId);
            return Result<SubOrderDetailDto>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
