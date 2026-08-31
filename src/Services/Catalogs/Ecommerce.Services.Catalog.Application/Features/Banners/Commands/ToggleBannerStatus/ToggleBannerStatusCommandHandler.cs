using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.Commands.ToggleBannerStatus;

public class ToggleBannerStatusCommandHandler(IEfUnitOfWork unitOfWork) 
    : IRequestHandler<ToggleBannerStatusCommand, Result>
{
    public async Task<Result> Handle(ToggleBannerStatusCommand command, CancellationToken cancellationToken)
    {
        var repo = unitOfWork.Repository<Banner, long>();
        var banner = await repo.GetByIdAsync(command.Id, cancellationToken);
        if (banner == null)
        {
            return Result.Failure("Không tìm thấy Banner.", EErrorCode.NotFound);
        }

        banner.ToggleStatus();

        if (banner.IsActive)
        {
            // Lấy toàn bộ các banner đang Active khác hiện tại, sắp xếp theo DisplayOrder hiện có
            var activeBanners = (await repo.GetAllAsync(b => b.IsActive && b.Id != banner.Id, cancellationToken: cancellationToken))
                .OrderBy(b => b.DisplayOrder)
                .ToList();

            int targetPosition = (command.CustomDisplayOrder.HasValue && command.CustomDisplayOrder.Value > 0)
                ? command.CustomDisplayOrder.Value
                : activeBanners.Count + 1;

            // Đưa targetPosition vào khoảng hợp lệ [1, activeBanners.Count + 1]
            if (targetPosition > activeBanners.Count + 1)
            {
                targetPosition = activeBanners.Count + 1;
            }

            // Chèn banner vào vị trí mong muốn
            activeBanners.Insert(targetPosition - 1, banner);

            // Re-order lại toàn bộ chuỗi banner đang active: 1, 2, 3, ...
            for (int i = 0; i < activeBanners.Count; i++)
            {
                activeBanners[i].DisplayOrder = i + 1;
                repo.Update(activeBanners[i]);
            }
        }
        else
        {
            // Khi ẩn banner này -> đưa DisplayOrder của nó về 0
            banner.DisplayOrder = 0;
            repo.Update(banner);

            // Re-order lại các banner còn lại đang active để không bị lủng thứ tự (1, 2, 3...)
            var remainingActiveBanners = (await repo.GetAllAsync(b => b.IsActive && b.Id != banner.Id, cancellationToken: cancellationToken))
                .OrderBy(b => b.DisplayOrder)
                .ToList();

            for (int i = 0; i < remainingActiveBanners.Count; i++)
            {
                remainingActiveBanners[i].DisplayOrder = i + 1;
                repo.Update(remainingActiveBanners[i]);
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
