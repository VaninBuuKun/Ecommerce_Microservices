namespace Ecommerce.Services.Catalog.Domain;

public class ProductImage
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public string ImageUrl { get; private set; }
    public bool IsMain { get; private set; }

    private ProductImage() {}

    public ProductImage(Guid productId, string imageUrl, bool isMain = false)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        ImageUrl = imageUrl;
        IsMain = isMain;
    }

    public void SetAsMain(bool isMain)
    {
        IsMain = isMain;
    }
}
