using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.Commands.ReorderBanners;

public class ReorderBannersCommandHandler(IEfUnitOfWork unitOfWork) 
    : IRequestHandler<ReorderBannersCommand, Result>
{
    public async Task<Result> Handle(ReorderBannersCommand command, CancellationToken cancellationToken)
    {
        if (command.BannerIds == null || command.BannerIds.Count == 0)
        {
            return Result.Success();
        }

        var repo = unitOfWork.Repository<Banner, long>();
        var allBanners = await repo.GetAllAsync(cancellationToken: cancellationToken);
        var bannerMap = allBanners.ToDictionary(b => b.Id);

        // Cập nhật DisplayOrder theo đúng thứ tự mảng ID gửi lên (1, 2, 3...)
        for (int i = 0; i < command.BannerIds.Count; i++)
        {
            var id = command.BannerIds[i];
            if (bannerMap.TryGetValue(id, out var banner))
            {
                banner.DisplayOrder = i + 1;
                repo.Update(banner);
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
