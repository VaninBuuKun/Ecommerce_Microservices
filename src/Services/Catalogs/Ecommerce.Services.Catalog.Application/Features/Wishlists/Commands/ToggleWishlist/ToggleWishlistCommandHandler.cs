using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.Events;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Wishlists.Commands.ToggleWishlist;

public class ToggleWishlistCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher eventPublisher,
    ILogger<ToggleWishlistCommandHandler> logger)
    : CommandHandler<ToggleWishlistCommand, bool>
{
    private readonly IGenericEfRepository<Wishlist, long> _wishlistRepository = unitOfWork.Repository<Wishlist, long>();
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();

    protected override async Task<Result<bool>> HandleCommandAsync(ToggleWishlistCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var product = await _productRepository.GetByIdAsync(command.ProductId, cancellationToken);
            if (product == null)
            {
                return Result<bool>.Failure("Sản phẩm không tồn tại.", EErrorCode.NotFound);
            }

            var existingWishlist = await _wishlistRepository.FirstOrDefaultAsync(
                w => w.CustomerId == command.CustomerId && w.ProductId == command.ProductId,
                null,
                cancellationToken);

            bool isLiked;
            if (existingWishlist != null)
            {
                _wishlistRepository.Delete(existingWishlist);
                await unitOfWork.SaveChangesAsync(cancellationToken);
                isLiked = false;
            }
            else
            {
                var newWishlist = new Wishlist(command.CustomerId, command.ProductId);
                _wishlistRepository.Add(newWishlist);
                await unitOfWork.SaveChangesAsync(cancellationToken);
                isLiked = true;
            }

            try
            {
                await eventPublisher.PublishAsync(new WishlistToggledEvent
                {
                    UserId = command.CustomerId,
                    ProductId = command.ProductId,
                    CategoryId = product.CategoryId,
                    IsAdded = isLiked,
                    ToggledAt = DateTime.UtcNow
                }, cancellationToken);
            }
            catch (Exception pubEx)
            {
                logger.LogError(pubEx, "Failed to publish WishlistToggledEvent for user {UserId} product {ProductId}", command.CustomerId, command.ProductId);
            }

            return Result<bool>.Success(isLiked);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi xảy ra khi cập nhật Wishlist cho Product {ProductId}", command.ProductId);
            return Result<bool>.Failure("Có lỗi xảy ra khi cập nhật danh sách yêu thích.", EErrorCode.InternalServerError);
        }
    }
}
