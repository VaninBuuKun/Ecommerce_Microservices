using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Wishlists.Commands.ToggleWishlist;

public class ToggleWishlistCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<ToggleWishlistCommandHandler> logger)
    : CommandHandler<ToggleWishlistCommand, bool>
{
    private readonly IGenericEfRepository<Wishlist, Guid> _wishlistRepository = unitOfWork.Repository<Wishlist, Guid>();
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();

    protected override async Task<Result<bool>> HandleCommandAsync(ToggleWishlistCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var productExists = await _productRepository.AnyAsync(p => p.Id == command.ProductId, cancellationToken);
            if (!productExists)
            {
                return Result<bool>.Failure("Sản phẩm không tồn tại.", EErrorCode.NotFound);
            }

            var existingWishlist = await _wishlistRepository.FirstOrDefaultAsync(
                w => w.CustomerId == command.CustomerId && w.ProductId == command.ProductId,
                null,
                cancellationToken);

            if (existingWishlist != null)
            {
                _wishlistRepository.Delete(existingWishlist);
                await unitOfWork.SaveChangesAsync(cancellationToken);
                return Result<bool>.Success(false); // Unliked
            }
            else
            {
                var newWishlist = new Wishlist(command.CustomerId, command.ProductId);

                _wishlistRepository.Add(newWishlist);
                await unitOfWork.SaveChangesAsync(cancellationToken);
                return Result<bool>.Success(true); // Liked
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi xảy ra khi cập nhật Wishlist cho Product {ProductId}", command.ProductId);
            return Result<bool>.Failure("Có lỗi xảy ra khi cập nhật danh sách yêu thích.", EErrorCode.InternalServerError);
        }
    }
}
