namespace Ecommerce.Services.Shippings.Api.Models.Entities;

public class Ward
{
    public long Id { get; set; }
    public long DistrictId { get; set; }
    public string Name { get; set; } = string.Empty; // Clean name (e.g., "Trúc Bạch")
    public string DisplayName { get; set; } = string.Empty; // Display name with prefix (e.g., "Phường Trúc Bạch")

    public string? GhnCode { get; set; }
    public string? GhtkCode { get; set; }

    public District District { get; set; } = null!;
}
