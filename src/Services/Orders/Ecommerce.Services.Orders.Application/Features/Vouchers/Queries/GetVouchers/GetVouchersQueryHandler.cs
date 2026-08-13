using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Ecommerce.Services.Orders.Domain.Specs;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetPlatformVoucher;

public class GetVouchersQueryHandler(IEfUnitOfWork unitOfWork, ILogger<GetVouchersQueryHandler> logger, IMapper mapper) : QueryHandler<GetVouchersQuery, List<VoucherDto>>
{
    private IGenericEfRepository<Voucher, Guid> voucherRepo => unitOfWork.Repository<Voucher, Guid>();
    protected override async Task<Result<List<VoucherDto>>> HandleQueryAsync(GetVouchersQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new VoucherQuerySpec(query.Code, query.Page, query.PageSize, query.DiscountType, query.UsageLimit, query.StartDate, query.EndDate, query.IsActive, query.ShopId);
            var vouchers = await voucherRepo.GetListAsync(spec, cancellationToken);
            
            var voucherDtos = mapper.Map<List<VoucherDto>>(vouchers);

            return Result<List<VoucherDto>>.Success(voucherDtos);
        }
        catch (Exception ex)
        {
            
            return Result<List<VoucherDto>>.Failure($"Error retrieving platform vouchers: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}