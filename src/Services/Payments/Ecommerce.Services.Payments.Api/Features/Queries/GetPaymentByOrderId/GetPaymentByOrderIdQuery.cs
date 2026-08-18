using System;
using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Payments.Api.Features.Queries.GetPaymentByOrderId;

public record PaymentByOrderDto(Guid PaymentId, string IconUrl, string Status, string MethodTitle, string ProviderName, string PaymentUrl);

public record GetPaymentByOrderIdQuery(Guid OrderId) : IRequest<Result<PaymentByOrderDto>>;
