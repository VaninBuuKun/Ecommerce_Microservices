using System;
using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CalOrderGrandTotal;

public record CalOrderGrandTotalCommand(
    long CustomerId, 
    Guid UserAddressId, 
    Guid? CheckoutSessionId = null
) : ICommand<CalOrderGrandTotalResponse>;
