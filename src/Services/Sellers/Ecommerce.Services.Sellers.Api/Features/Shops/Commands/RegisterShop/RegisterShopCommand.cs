using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Sellers.Api.Models.Entities;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.RegisterShop;

public record RegisterShopCommand(
    long OwnerUserId,
    string Name,
    string Description,
    string RecipientName,
    string Phone,
    string Province,
    string District,
    string Ward,
    string AddressLine,
    int ProvinceId,
    int DistrictId,
    string WardCode,
    string IdentityCardNumber
) : ICommand<Shop>;
