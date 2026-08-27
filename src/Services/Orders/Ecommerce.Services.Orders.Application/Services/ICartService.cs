using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Cart;

namespace Ecommerce.Services.Orders.Application.Services;

public interface ICartService
{
    Task<Result<CartDto>> GetCartByCustomerId(long customerId);
    Task<Result> ClearCart(long customerId, List<long> variantIds);
}