using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetAllShops;

public record ShopAdminDto(
    long Id,
    long OwnerUserId,
    string Name,
    string Description,
    string? LogoUrl,
    string Status,
    DateTimeOffset CreatedDate);

public record GetAllShopsQueryResult(
    List<ShopAdminDto> Items,
    int TotalCount,
    int PageNumber,
    int PageSize);

public record GetAllShopsQuery(
    int PageNumber = 1,
    int PageSize = 10,
    string? SearchTerm = null,
    string? Status = null) : IQuery<GetAllShopsQueryResult>;

public class GetAllShopsQueryHandler(
    Persistances.SellerDbContext dbContext,
    ILogger<GetAllShopsQueryHandler> logger)
    : IQueryHandler<GetAllShopsQuery, GetAllShopsQueryResult>
{
    public async Task<Result<GetAllShopsQueryResult>> Handle(GetAllShopsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = dbContext.Shops.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var term = request.SearchTerm.Trim().ToLower();
                query = query.Where(s => s.Name.ToLower().Contains(term) 
                                      || s.Description.ToLower().Contains(term)
                                      || s.Id.ToString() == term);
            }

            if (!string.IsNullOrWhiteSpace(request.Status) && request.Status != "All")
            {
                if (Enum.TryParse<ShopStatus>(request.Status, true, out var parsedStatus))
                {
                    query = query.Where(s => s.Status == parsedStatus);
                }
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
            var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

            var shops = await query
                .OrderByDescending(s => s.CreatedDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var items = shops.Select(s => new ShopAdminDto(
                s.Id,
                s.OwnerUserId,
                s.Name,
                s.Description,
                s.LogoUrl,
                s.Status.ToString(),
                s.CreatedDate
            )).ToList();

            var result = new GetAllShopsQueryResult(items, totalCount, pageNumber, pageSize);
            return Result<GetAllShopsQueryResult>.Success(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GetAllShopsQuery: Lỗi khi truy vấn danh sách tất cả các shop.");
            return Result<GetAllShopsQueryResult>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
