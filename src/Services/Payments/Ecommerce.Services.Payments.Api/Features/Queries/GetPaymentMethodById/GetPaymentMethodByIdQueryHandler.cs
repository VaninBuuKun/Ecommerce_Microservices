using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Payments.Api.Models.Entities;
using MediatR;

namespace Ecommerce.Services.Payments.Api.Features.Queries.GetPaymentMethodById;

public class GetPaymentMethodByIdQueryHandler(IEfUnitOfWork unitOfWork) 
    : IRequestHandler<GetPaymentMethodByIdQuery, Result<PaymentMethodDto>>
{
    public async Task<Result<PaymentMethodDto>> Handle(GetPaymentMethodByIdQuery request, CancellationToken cancellationToken)
    {
        var repo = unitOfWork.Repository<PaymentMethod, long>();
        var method = await repo.GetByIdAsync(request.Id, cancellationToken);
        if (method == null)
        {
            return Result<PaymentMethodDto>.Failure("Không tìm thấy phương thức thanh toán.", EErrorCode.NotFound);
        }

        var dto = new PaymentMethodDto(
            method.Id, 
            method.Title, 
            method.SubTitle ?? string.Empty, 
            method.ProviderName, 
            method.IconUrl ?? string.Empty, 
            method.IsActive
        );

        return Result<PaymentMethodDto>.Success(dto);
    }
}
