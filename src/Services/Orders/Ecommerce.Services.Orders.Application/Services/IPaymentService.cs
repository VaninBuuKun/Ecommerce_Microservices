using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

using Ecommerce.Services.Orders.Application.Commons.Dtos.Payments;

namespace Ecommerce.Services.Orders.Application.Services;

public interface IPaymentService
{
    Task<Result<string?>> CreatePaymentAsync(Guid orderId, decimal amount, string paymentProvider, CancellationToken cancellationToken = default);
    Task<Result<PaymentMethodDto>> GetPaymentMethodAsync(long id, CancellationToken cancellationToken = default);
    Task<Result<PaymentDto>> GetPaymentByOrderAsync(Guid orderId, CancellationToken cancellationToken = default);
}
