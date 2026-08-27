using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Ecommerce.Services.Catalog.Domain;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Reviews.Queries.GetProductReviews;

public record GetProductReviewsQuery(long ProductId, int PageNumber = 1, int PageSize = 10) 
    : IRequest<Result<PagedResult<ProductReviewDto>>>;

public class GetProductReviewsQueryHandler(IEfUnitOfWork unitOfWork, IIdentityService identityService)
    : IRequestHandler<GetProductReviewsQuery, Result<PagedResult<ProductReviewDto>>>
{
    private readonly IGenericEfRepository<ProductReview, long> _reviewRepository = unitOfWork.Repository<ProductReview, long>();

    public async Task<Result<PagedResult<ProductReviewDto>>> Handle(GetProductReviewsQuery request, CancellationToken cancellationToken)
    {
        var totalCount = await _reviewRepository.CountAsync(r => r.ProductId == request.ProductId, cancellationToken);
        
        var reviews = await _reviewRepository.GetPageAsync(
            pageNumber: request.PageNumber,
            pageSize: request.PageSize,
            predicate: r => r.ProductId == request.ProductId,
            orderBy: q => q.OrderByDescending(r => r.CreatedDate),
            cancellationToken: cancellationToken
        );

        var customerIds = reviews.Select(r => r.CustomerId).Distinct().ToList();
        var userDict = new Dictionary<long, UserDetailDto>();

        if (customerIds.Count > 0)
        {
            var tasks = customerIds.Select(id => identityService.GetUserAsync(id, cancellationToken));
            var results = await Task.WhenAll(tasks);
            foreach (var res in results)
            {
                if (res.IsSuccess && res.Value != null)
                {
                    userDict[res.Value.Id] = res.Value;
                }
            }
        }

        var dtos = reviews.Select(r => {
            userDict.TryGetValue(r.CustomerId, out var user);
            return new ProductReviewDto
            {
                Id = r.Id,
                ProductId = r.ProductId,
                CustomerId = r.CustomerId,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedDate = r.CreatedDate,
                Media = r.Media,
                CustomerName = user?.FullName ?? $"Khách hàng #{r.CustomerId}",
                CustomerAvatarUrl = user?.AvatarUrl ?? string.Empty
            };
        }).ToList();

        var pagedResult = new PagedResult<ProductReviewDto>(dtos, totalCount, request.PageNumber, request.PageSize);
        return Result<PagedResult<ProductReviewDto>>.Success(pagedResult);
    }
}
