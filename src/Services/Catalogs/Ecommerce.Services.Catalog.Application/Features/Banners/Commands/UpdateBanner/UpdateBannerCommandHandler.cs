using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.Commands.UpdateBanner;

public class UpdateBannerCommandHandler(IEfUnitOfWork unitOfWork) 
    : IRequestHandler<UpdateBannerCommand, Result>
{
    public async Task<Result> Handle(UpdateBannerCommand command, CancellationToken cancellationToken)
    {
        var repo = unitOfWork.Repository<Banner, long>();
        var banner = await repo.GetByIdAsync(command.Id, cancellationToken);
        if (banner == null)
        {
            return Result.Failure("Không tìm thấy Banner.", EErrorCode.NotFound);
        }

        var req = command.Request;
        if (string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.ImageUrl))
        {
            return Result.Failure("Tiêu đề và đường dẫn hình ảnh không được để trống.");
        }

        banner.Update(
            req.Title.Trim(),
            req.Subtitle?.Trim(),
            req.Badge?.Trim(),
            req.ImageUrl.Trim(),
            string.IsNullOrWhiteSpace(req.ButtonText) ? "Mua ngay" : req.ButtonText.Trim(),
            string.IsNullOrWhiteSpace(req.TargetUrl) ? "/products" : req.TargetUrl.Trim(),
            string.IsNullOrWhiteSpace(req.ThemeGradient) ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" : req.ThemeGradient.Trim(),
            banner.DisplayOrder,
            banner.IsActive
        );

        repo.Update(banner);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
