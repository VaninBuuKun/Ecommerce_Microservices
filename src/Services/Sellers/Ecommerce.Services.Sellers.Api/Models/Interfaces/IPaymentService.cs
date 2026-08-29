using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Sellers.Api.Models.Interfaces;

public interface IPaymentService
{
    Task<Result<bool>> CheckShopWalletAsync(long userId, CancellationToken cancellationToken = default);
}
