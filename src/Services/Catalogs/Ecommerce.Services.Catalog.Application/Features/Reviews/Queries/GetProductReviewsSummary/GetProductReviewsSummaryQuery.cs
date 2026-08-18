using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Reviews.Queries.GetProductReviewsSummary;

public record GetProductReviewsSummaryQuery(Guid ProductId) : IRequest<Result<ProductReviewSummaryDto>>;

public class GetProductReviewsSummaryQueryHandler(IEfUnitOfWork unitOfWork)
    : IRequestHandler<GetProductReviewsSummaryQuery, Result<ProductReviewSummaryDto>>
{
    private readonly IGenericEfRepository<ProductReview, Guid> _reviewRepository = unitOfWork.Repository<ProductReview, Guid>();

    public async Task<Result<ProductReviewSummaryDto>> Handle(GetProductReviewsSummaryQuery request, CancellationToken cancellationToken)
    {
        var reviews = await _reviewRepository.GetAllAsync(
            predicate: r => r.ProductId == request.ProductId,
            cancellationToken: cancellationToken
        );

        if (reviews.Count == 0)
        {
            return Result<ProductReviewSummaryDto>.Success(new ProductReviewSummaryDto
            {
                AverageRating = 0,
                TotalReviews = 0
            });
        }

        var totalReviews = reviews.Count;
        var averageRating = Math.Round(reviews.Average(r => r.Rating), 1);

        var summary = new ProductReviewSummaryDto
        {
            AverageRating = averageRating,
            TotalReviews = totalReviews,
            OneStarCount = reviews.Count(r => r.Rating == 1),
            TwoStarCount = reviews.Count(r => r.Rating == 2),
            ThreeStarCount = reviews.Count(r => r.Rating == 3),
            FourStarCount = reviews.Count(r => r.Rating == 4),
            FiveStarCount = reviews.Count(r => r.Rating == 5)
        };

        return Result<ProductReviewSummaryDto>.Success(summary);
    }
}
