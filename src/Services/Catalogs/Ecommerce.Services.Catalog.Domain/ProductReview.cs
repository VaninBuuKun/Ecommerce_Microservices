using BuildingBlocks.Shared.Domains;
using Ecommerce.Services.Catalog.Domain.Products;

namespace Ecommerce.Services.Catalog.Domain;

public class ProductReview : EntityTrackingBase<Guid>
{
    public Guid ProductId { get; private set; }
    public long CustomerId { get; private set; }
    public int Rating { get; private set; } // 1 - 5
    public string Comment { get; private set; }
    public DateTimeOffset CreatedDate { get; private set; }

    public Product Product { get; private set; } = null!;
    public ICollection<ProductReviewImage> Images { get; private set; } = new List<ProductReviewImage>();

    private ProductReview() {}

    public ProductReview(Guid productId, long customerId, int rating, string comment)
    {
        if (rating < 1 || rating > 5)
        {
            throw new ArgumentException("Số sao đánh giá phải từ 1 đến 5.");
        }

        Id = Guid.NewGuid();
        ProductId = productId;
        CustomerId = customerId;
        Rating = rating;
        Comment = comment;
        CreatedDate = DateTimeOffset.UtcNow;
    }

    public void AddImage(string imageUrl)
    {
        Images.Add(new ProductReviewImage(Id, imageUrl));
    }
}
