using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetAvailableVouchers;

public class GetAvailableVouchersQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetAvailableVouchersQueryHandler> logger,
    IMapper mapper)
    : QueryHandler<GetAvailableVouchersQuery, List<VoucherDto>>
{
    private IGenericEfRepository<Voucher, long> voucherRepo => unitOfWork.Repository<Voucher, long>();
    private IGenericEfRepository<VoucherUsage, Guid> voucherUsageRepo => unitOfWork.Repository<VoucherUsage, Guid>();

    protected override async Task<Result<List<VoucherDto>>> HandleQueryAsync(
        GetAvailableVouchersQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var now = DateTimeOffset.UtcNow;

            // 1. Lấy voucher còn hiệu lực về số lượng tổng thể
            var vouchers = await voucherRepo.GetAllAsync(v =>
                v.IsActive &&
                v.StartDate <= now &&
                now <= v.EndDate &&
                v.UsageCount < v.MaxUsageCount &&
                (query.ShopId == null
                    ? v.Scope == VoucherScope.Platform
                    : (v.Scope == VoucherScope.Shop && v.ShopId == query.ShopId.Value)),
                cancellationToken: cancellationToken);

            if (vouchers.Count == 0)
                return Result<List<VoucherDto>>.Success(new List<VoucherDto>());

            // 2. Batch query: đếm số lần user đã dùng từng voucher (tránh N+1)
            var voucherIds = vouchers.Select(v => v.Id).ToList();
            var userUsages = await voucherUsageRepo.GetAllAsync(
                u => voucherIds.Contains(u.VoucherId) && u.UserId == query.CustomerId,
                cancellationToken: cancellationToken);

            var usageCountByVoucher = userUsages
                .GroupBy(u => u.VoucherId)
                .ToDictionary(g => g.Key, g => g.Count());

            // 3. Lọc bỏ voucher mà user đã đạt MaxUsagePerUser
            var filteredVouchers = vouchers
                .Where(v =>
                {
                    usageCountByVoucher.TryGetValue(v.Id, out var userCount);
                    return userCount < v.MaxUsagePerUser;
                })
                .ToList();

            var voucherDtos = mapper.Map<List<VoucherDto>>(filteredVouchers);
            return Result<List<VoucherDto>>.Success(voucherDtos);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi lấy danh sách voucher khả dụng.");
            return Result<List<VoucherDto>>.Failure(
                $"Error retrieving available vouchers: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}