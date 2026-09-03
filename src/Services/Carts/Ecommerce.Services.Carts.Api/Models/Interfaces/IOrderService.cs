using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;

namespace Ecommerce.Services.Carts.Api.Models.Interfaces;

public record SubOrderItemRebuyItem(long VariantId, long ProductId, int Quantity);

public interface IOrderService
{
    Task<Result<List<SubOrderItemRebuyItem>>> GetSubOrderItemsForRebuyAsync(long subOrderId, long customerId);
}
