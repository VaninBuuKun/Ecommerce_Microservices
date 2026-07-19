using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Carts.Api.Models.Interfaces;

public interface ISellerService
{
    Task<Result<bool>> ValidateShopOwnerAsync(long shopId, long userId);
    Task<Result<Dictionary<long, string>>> GetShopNamesAsync(List<long> shopIds);
}
