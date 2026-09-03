namespace Ecommerce.Services.Carts.Api.Models.Dtos;

public class CartItemError
{
    public string productId { get; set; }
    public string errorMessage { get; set; }
}

public class CartValidationDto
{
    public List<CartItemError> errors { get; set; } = new();
    public bool isValid { get; set; }
}
