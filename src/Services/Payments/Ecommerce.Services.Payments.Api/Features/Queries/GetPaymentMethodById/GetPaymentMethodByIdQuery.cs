using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Payments.Api.Features.Queries.GetPaymentMethodById;

public record PaymentMethodDto(long Id, string Title, string SubTitle, string ProviderName, string IconUrl, bool IsActive);

public record GetPaymentMethodByIdQuery(long Id) : IRequest<Result<PaymentMethodDto>>;
