using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Payments.Api.Models.Entities;
using MediatR;

namespace Ecommerce.Services.Payments.Api.Features.Queries.GetPaymentByOrderId;

public class GetPaymentByOrderIdQueryHandler(IEfUnitOfWork unitOfWork) 
    : IRequestHandler<GetPaymentByOrderIdQuery, Result<PaymentByOrderDto>>
{
    public async Task<Result<PaymentByOrderDto>> Handle(GetPaymentByOrderIdQuery request, CancellationToken cancellationToken)
    {
        var repo = unitOfWork.Repository<Payment, Guid>();
        var payment = await repo.FirstOrDefaultAsync(
            predicate: p => p.OrderId == request.OrderId,
            includes: p => p.Method,
            cancellationToken: cancellationToken
        );

        if (payment == null)
        {
            return Result<PaymentByOrderDto>.Failure("Không tìm thấy thông tin thanh toán cho đơn hàng.", EErrorCode.NotFound);
        }

        var dto = new PaymentByOrderDto(
            payment.Id,
            payment.Method?.IconUrl ?? string.Empty,
            payment.Status.ToString(),
            payment.Method?.Title ?? string.Empty,
            payment.Method?.ProviderName ?? string.Empty,
            payment.PaymentUrl ?? string.Empty
        );

        return Result<PaymentByOrderDto>.Success(dto);
    }
}
