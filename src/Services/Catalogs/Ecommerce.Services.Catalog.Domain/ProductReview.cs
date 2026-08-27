using System;
using System.Collections.Generic;
using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Catalog.Domain.Products;

namespace Ecommerce.Services.Catalog.Domain;

public class ProductReview : EntityTrackingBase<long>
{
    public long ProductId { get; private set; }
    public long CustomerId { get; private set; }
    public int Rating { get; private set; } // 1 - 5
    public string Comment { get; private set; } = string.Empty;

    public Product Product { get; private set; } = null!;
    
    public List<string> Media { get; private set; } = new();

    private ProductReview() {}

    public ProductReview(long productId, long customerId, int rating, string comment, List<string>? media = null)
    {
        if (rating < 1 || rating > 5)
        {
            throw new ArgumentException("Số sao đánh giá phải từ 1 đến 5.");
        }

        ProductId = productId;
        CustomerId = customerId;
        Rating = rating;
        Comment = comment;
        CreatedDate = DateTimeOffset.UtcNow;
        
        if (media != null)
        {
            Media = media;
        }
    }

    public void AddMedia(string mediaUrl)
    {
        if (!string.IsNullOrWhiteSpace(mediaUrl))
        {
            Media.Add(mediaUrl);
        }
    }
}
