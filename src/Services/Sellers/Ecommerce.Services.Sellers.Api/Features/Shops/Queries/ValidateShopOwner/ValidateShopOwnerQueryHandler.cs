using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.ValidateShopOwner;

public class ValidateShopOwnerQueryHandler(IEfUnitOfWork unitOfWork) 
    : IQueryHandler<ValidateShopOwnerQuery, ValidateShopOwnerResultDto>
{
    public async Task<Result<ValidateShopOwnerResultDto>> Handle(ValidateShopOwnerQuery request, CancellationToken cancellationToken)
    {
        var shopRepo = unitOfWork.Repository<Shop, long>();
        var shop = await shopRepo.FirstOrDefaultAsync(s => s.Id == request.ShopId);

        if (shop == null)
        {
            return Result<ValidateShopOwnerResultDto>.Success(new ValidateShopOwnerResultDto(false, string.Empty, false));
        }

        var isOwner = shop.OwnerUserId == request.UserId;
        var isActive = shop.Status == ShopStatus.Active;

        return Result<ValidateShopOwnerResultDto>.Success(new ValidateShopOwnerResultDto(isOwner, shop.Name, isActive));
    }
}
