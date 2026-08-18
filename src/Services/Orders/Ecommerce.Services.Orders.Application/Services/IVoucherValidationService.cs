using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Orders.Domain;

namespace Ecommerce.Services.Orders.Application.Services;

public class VoucherValidationResult
{
    public bool IsSuccess { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public decimal PlatformDiscount { get; set; }
    public Voucher? PlatformVoucher { get; set; }
    public Dictionary<long, decimal> ShopDiscounts { get; set; } = new();
    public Dictionary<long, Voucher> ShopVouchers { get; set; } = new();
}

public interface IVoucherValidationService
{
    Task<Result<VoucherValidationResult>> ValidateVouchersAsync(
        long customerId,
        decimal totalOrderSubtotal,
        Dictionary<long, decimal> shopSubtotals,
        string? platformVoucherCode,
        Dictionary<long, string>? shopVoucherCodes,
        CancellationToken cancellationToken
    );
}
