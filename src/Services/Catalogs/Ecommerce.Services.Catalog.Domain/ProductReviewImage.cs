using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Catalog.Domain;

public class ProductReviewImage : EntityBase<Guid>
{
    public Guid ProductReviewId { get; private set; }
    public string ImageUrl { get; private set; }

    public ProductReviewImage() {}

    public ProductReviewImage(Guid productReviewId, string imageUrl)
    {
        Id = Guid.NewGuid();
        ProductReviewId = productReviewId;
        ImageUrl = imageUrl;
    }
}
