using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CalOrderGrandTotal;

public record CalOrderGrandTotalCommand(long CustomerId, Guid UserAddressId, Dictionary<long, string> ShopShippingSelections) : ICommand<CalOrderGrandTotalResponse>;
