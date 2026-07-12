using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Carts.Api.Models.Entities;

namespace Ecommerce.Services.Carts.Api.Features.Carts.Queries.GetBasicCart;

public record GetBasicCartQuery(long CustomerId) : IQuery<Cart>;
