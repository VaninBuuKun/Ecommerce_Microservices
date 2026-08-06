using System;
using System.Collections.Generic;
using BuildingBlocks.Shared.Commons;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Reviews.Commands.CreateProductReview;

public record CreateProductReviewCommand(
    Guid ProductId, 
    long CustomerId, 
    int Rating, 
    string Comment, 
    List<string>? ImageUrls) : IRequest<Result<Guid>>;
