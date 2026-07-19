using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Catalog.Application.Commons.Interfaces;

public interface ISellerService
{
    Task<Result<bool>> ValidateShopOwnerAsync(long shopId, long userId);
}
