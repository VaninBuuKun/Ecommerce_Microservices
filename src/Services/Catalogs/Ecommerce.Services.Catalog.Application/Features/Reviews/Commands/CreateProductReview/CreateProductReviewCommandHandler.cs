using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Ecommerce.Services.Catalog.Application.Commons.Repositories;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Reviews.Commands.CreateProductReview;

public class CreateProductReviewCommandHandler(
    IEfUnitOfWork unitOfWork, 
    IProductRepository productRepository,
    IOrderService orderService) 
    : IRequestHandler<CreateProductReviewCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateProductReviewCommand request, CancellationToken cancellationToken)
    {
        var product = await productRepository.GetByIdAsync(request.ProductId, cancellationToken);
        if (product == null)
        {
            return Result<Guid>.Failure("Sản phẩm không tồn tại.", EErrorCode.NotFound);
        }

        // 1. Kiểm tra gRPC xem người dùng có bao nhiêu đơn hàng thành công chứa sản phẩm này
        var completedSubOrderResult = await orderService.GetCompletedSubOrderCountForProductAsync(request.CustomerId, request.ProductId, cancellationToken);
        if (!completedSubOrderResult.IsSuccess)
        {
            return Result<Guid>.Failure(completedSubOrderResult.Message, completedSubOrderResult.ErrorCode);
        }

        var completedSubOrderCount = completedSubOrderResult.Value;

        // 2. Đếm số lượt review hiện tại của người dùng cho sản phẩm này
        var reviewRepository = unitOfWork.Repository<ProductReview, Guid>();
        var existingReviewsCount = await reviewRepository.CountAsync(r => r.CustomerId == request.CustomerId && r.ProductId == request.ProductId, cancellationToken);

        if (existingReviewsCount >= completedSubOrderCount)
        {
            return Result<Guid>.Failure("Bạn chưa thể đánh giá sản phẩm này. Số lượt đánh giá không thể vượt quá số đơn hàng đã giao thành công.", EErrorCode.Forbidden);
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

        return Result<Guid>.Success(review.Id);
    }
}

