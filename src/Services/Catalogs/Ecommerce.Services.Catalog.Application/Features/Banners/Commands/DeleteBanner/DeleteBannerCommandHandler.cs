using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Banners.Commands.DeleteBanner;

public class DeleteBannerCommandHandler(IEfUnitOfWork unitOfWork) 
    : IRequestHandler<DeleteBannerCommand, Result>
{
    public async Task<Result> Handle(DeleteBannerCommand command, CancellationToken cancellationToken)
    {
        var repo = unitOfWork.Repository<Banner, long>();
        var banner = await repo.GetByIdAsync(command.Id, cancellationToken);
        if (banner == null)
        {
            return Result.Failure("Không tìm thấy Banner.", EErrorCode.NotFound);
        }

        repo.Delete(banner);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
