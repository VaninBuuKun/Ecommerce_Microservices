using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.Events;
using BuildingBlocks.Shared.InfrastructureInterfaces.IdGenerator;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Ecommerce.Services.Catalog.Application.Commons.Repositories;
using Ecommerce.Services.Catalog.Domain;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Reviews.Commands.CreateProductReview;

public class CreateProductReviewCommandHandler(
    IEfUnitOfWork unitOfWork, 
    IProductRepository productRepository,
    IOrderService orderService,
    IEventPublisher eventPublisher,
    ILogger<CreateProductReviewCommandHandler> logger) 
    : IRequestHandler<CreateProductReviewCommand, Result<long>>
{
    public async Task<Result<long>> Handle(CreateProductReviewCommand request, CancellationToken cancellationToken)
    {
        var product = await productRepository.GetByIdAsync(request.ProductId, cancellationToken);
        if (product == null)
        {
            return Result<long>.Failure("Sản phẩm không tồn tại.", EErrorCode.NotFound);
        }

        // 1. Kiểm tra gRPC xem người dùng có bao nhiêu đơn hàng thành công chứa sản phẩm này
        var completedSubOrderResult = await orderService.GetCompletedSubOrderCountForProductAsync(request.CustomerId, request.ProductId, cancellationToken);
        if (!completedSubOrderResult.IsSuccess)
        {
            return Result<long>.Failure(completedSubOrderResult.Message, completedSubOrderResult.ErrorCode);
        }

        var completedSubOrderCount = completedSubOrderResult.Value;

        // 2. Đếm số lượt review hiện tại của người dùng cho sản phẩm này
        var reviewRepository = unitOfWork.Repository<ProductReview, long>();
        var existingReviewsCount = await reviewRepository.CountAsync(r => r.CustomerId == request.CustomerId && r.ProductId == request.ProductId, cancellationToken);

        if (existingReviewsCount >= completedSubOrderCount)
        {
            return Result<long>.Failure("Bạn chưa thể đánh giá sản phẩm này. Số lượt đánh giá không thể vượt quá số đơn hàng đã giao thành công.", EErrorCode.Forbidden);
        }
        
        // Khởi tạo Review kèm theo danh sách media (ảnh/video)
        var review = new ProductReview(
            request.ProductId, 
            request.CustomerId, 
            request.Rating, 
            request.Comment, 
            request.ImageUrls);

        reviewRepository.Add(review);
        
        await unitOfWork.SaveChangesAsync(cancellationToken);

        // Cập nhật rating trung bình của sản phẩm
        await productRepository.UpdateProductRatingsAsync(request.ProductId, request.Rating, cancellationToken);

        try
        {
            var updatedProduct = await productRepository.GetByIdAsync(request.ProductId, cancellationToken);
            await eventPublisher.PublishAsync(new ProductReviewCreatedEvent
            {
                ReviewId = review.Id,
                ProductId = request.ProductId,
                UserId = request.CustomerId,
                Rating = request.Rating,
                NewAverageRating = updatedProduct?.AverageRating ?? request.Rating,
                NewReviewCount = updatedProduct?.ReviewCount ?? 1,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);
        }
        catch (Exception pubEx)
        {
            logger.LogError(pubEx, "Failed to publish ProductReviewCreatedEvent for review {ReviewId}", review.Id);
        }

        return Result<long>.Success(review.Id);
    }
}

