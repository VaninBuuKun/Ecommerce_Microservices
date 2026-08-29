using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Entities;

namespace Ecommerce.Services.Payments.Api.Models.Interfaces;

public interface IPaymentGateway
{
    public string GatewayName { get; }
    Task<CreatePaymentResult> CreatePaymentAsync(Payment payment, CancellationToken ct = default);
    Task<bool> VerifyCallbackAsync(Dictionary<string, string> callbackParams);
}
