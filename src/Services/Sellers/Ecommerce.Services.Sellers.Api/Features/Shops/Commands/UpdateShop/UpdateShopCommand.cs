using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Sellers.Api.Models.Entities;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.UpdateShop;

public record UpdateShopCommand(
    long ShopId,
    long OwnerUserId,
    string Name,
    string Description,
    string? LogoUrl,
    string RecipientName,
    string Phone,
    string AddressLine,
    long ProvinceId,
    long DistrictId,
    long WardId
) : ICommand<Shop>;
