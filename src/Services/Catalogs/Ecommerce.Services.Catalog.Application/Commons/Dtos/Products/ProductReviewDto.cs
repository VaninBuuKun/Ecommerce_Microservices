using System;
using System.Collections.Generic;

namespace Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

public class ProductReviewDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public long CustomerId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTimeOffset CreatedDate { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerAvatarUrl { get; set; } = string.Empty;
    public List<string> Media { get; set; } = new();
}

public class ProductReviewSummaryDto
{
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    
    // Đếm số lượt đánh giá tương ứng 1, 2, 3, 4, 5 sao
    public int OneStarCount { get; set; }
    public int TwoStarCount { get; set; }
    public int ThreeStarCount { get; set; }
    public int FourStarCount { get; set; }
    public int FiveStarCount { get; set; }
}
