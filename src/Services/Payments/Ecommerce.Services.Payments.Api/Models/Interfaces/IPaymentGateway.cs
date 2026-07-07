using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Payments.Api.Models.Dtos;

namespace Ecommerce.Services.Payments.Api.Models.Interfaces;

public interface IPaymentGateway
{
    Task<CreatePaymentResult> CreatePaymentAsync(CreatePaymentInput input, CancellationToken ct = default);
}