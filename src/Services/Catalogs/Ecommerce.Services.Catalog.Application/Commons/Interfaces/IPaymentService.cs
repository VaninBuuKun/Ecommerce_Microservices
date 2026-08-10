using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Catalog.Application.Commons.Interfaces;

public interface IPaymentService
{
    Task<Result<bool>> CheckShopWalletAsync(long userId);
}
