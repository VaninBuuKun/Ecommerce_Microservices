using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.Commands.CreateBanner;

public class CreateBannerCommandHandler(IEfUnitOfWork unitOfWork) 
    : IRequestHandler<CreateBannerCommand, Result<long>>
{
    public async Task<Result<long>> Handle(CreateBannerCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        if (string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.ImageUrl))
        {
            return Result<long>.Failure("Tiêu đề và đường dẫn hình ảnh không được để trống.");
        }

        var banner = new Banner(
            req.Title.Trim(),
            req.Subtitle?.Trim(),
            req.Badge?.Trim(),
            req.ImageUrl.Trim(),
            string.IsNullOrWhiteSpace(req.ButtonText) ? "Mua ngay" : req.ButtonText.Trim(),
            string.IsNullOrWhiteSpace(req.TargetUrl) ? "/products" : req.TargetUrl.Trim(),
            string.IsNullOrWhiteSpace(req.ThemeGradient) ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" : req.ThemeGradient.Trim(),
            0,
            false
        );

        unitOfWork.Repository<Banner, long>().Add(banner);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(banner.Id);
    }
}
