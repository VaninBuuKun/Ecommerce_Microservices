
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Repositories;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Reviews.Commands.CreateProductReview;

public class CreateProductReviewCommandHandler(IEfUnitOfWork unitOfWork, IProductRepository productRepository) 
    : IRequestHandler<CreateProductReviewCommand, Result<Guid>>
{
    private readonly IGenericEfRepository<ProductReviewImage, Guid> reviewImageRepository = unitOfWork.Repository<ProductReviewImage, Guid>();
    public async Task<Result<Guid>> Handle(CreateProductReviewCommand request, CancellationToken cancellationToken)
    {
        var product = await productRepository.GetByIdAsync(request.ProductId, cancellationToken);
        if (product == null)
        {
            return Result<Guid>.Failure("Sản phẩm không tồn tại.", EErrorCode.NotFound);
        }
        
        var review = new ProductReview(request.ProductId, request.CustomerId, request.Rating, request.Comment);
        
        if (request.ImageUrls != null)
        {
            foreach (var url in request.ImageUrls)
            {
                reviewImageRepository.Add(new ProductReviewImage(review.Id, url));
            }
        }

        var reviewRepository = unitOfWork.Repository<ProductReview, Guid>();
        reviewRepository.Add(review);
        
        await unitOfWork.SaveChangesAsync(cancellationToken);

        // Tránh lost update
        await productRepository.UpdateProductRatingsAsync(request.ProductId, request.Rating, cancellationToken);

        return Result<Guid>.Success(review.Id);
    }
}
