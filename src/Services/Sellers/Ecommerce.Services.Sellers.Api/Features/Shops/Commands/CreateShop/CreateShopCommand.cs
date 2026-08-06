using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Sellers.Api.Models.Entities;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.CreateShop;

public record CreateShopCommand(
    long OwnerUserId,
    string Name,
    string Description,
    string? LogoUrl
) : ICommand<Shop>;
//
// string RecipientName,
// string Phone,
// string AddressLine,
// long ProvinceId,
// long DistrictId,
// long WardId
