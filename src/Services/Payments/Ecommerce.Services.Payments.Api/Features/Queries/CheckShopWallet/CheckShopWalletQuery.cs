using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Payments.Api.Features.Queries.CheckShopWallet;

public record ShopWalletDto(bool HasWallet, bool IsLocked, string Balance);

public record CheckShopWalletQuery(long UserId) : IRequest<Result<ShopWalletDto>>;
