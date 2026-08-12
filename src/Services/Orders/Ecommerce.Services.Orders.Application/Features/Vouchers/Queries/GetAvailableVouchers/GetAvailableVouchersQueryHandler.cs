using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetPlatformVoucher;

public class GetAvailableVouchersQueryHandler(IEfUnitOfWork unitOfWork, ILogger<GetAvailableVouchersQueryHandler> logger, IMapper mapper) : QueryHandler<GetAvailableVouchersQuery, List<VoucherDto>>
{
    private IGenericEfRepository<Voucher, Guid> voucherRepo => unitOfWork.Repository<Voucher, Guid>();
    protected override async Task<Result<List<VoucherDto>>> HandleQueryAsync(GetAvailableVouchersQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var now = DateTimeOffset.UtcNow;
            var vouchers = await voucherRepo.GetAllAsync(v => v.Scope == VoucherScope.Platform && v.StartDate <= now && now <= v.EndDate && v.UsageCount < v.MaxUsageCount, cancellationToken: cancellationToken);
            
            var voucherDtos = mapper.Map<List<VoucherDto>>(vouchers);

            return Result<List<VoucherDto>>.Success(voucherDtos);
        }
        catch (Exception ex)
        {
            
            return Result<List<VoucherDto>>.Failure($"Error retrieving platform vouchers: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}