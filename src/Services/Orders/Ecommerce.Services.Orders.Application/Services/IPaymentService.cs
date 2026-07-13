using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Orders.Application.Services;

public interface IPaymentService
{
    Task<Result<string?>> CreatePaymentAsync(Guid orderId, decimal amount, string paymentProvider, CancellationToken cancellationToken = default);
}
