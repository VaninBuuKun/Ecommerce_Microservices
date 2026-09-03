using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Features.Banners.DTOs;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.Queries.GetBannersForAdmin;

public class GetBannersForAdminQueryHandler(IEfUnitOfWork unitOfWork) 
    : IRequestHandler<GetBannersForAdminQuery, Result<List<BannerDto>>>
{
    public async Task<Result<List<BannerDto>>> Handle(GetBannersForAdminQuery request, CancellationToken cancellationToken)
    {
        var banners = await unitOfWork.Repository<Banner, long>()
            .GetAllAsync(cancellationToken: cancellationToken);

        var result = banners
            .OrderBy(b => b.DisplayOrder)
            .ThenByDescending(b => b.CreatedDate)
            .Select(b => new BannerDto(
                b.Id,
                b.Title,
                b.Subtitle,
                b.Badge,
                b.ImageUrl,
                b.ButtonText,
                b.TargetUrl,
                b.ThemeGradient,
                b.DisplayOrder,
                b.IsActive,
                b.CreatedDate
            ))
            .ToList();

        return Result<List<BannerDto>>.Success(result);
    }
}
