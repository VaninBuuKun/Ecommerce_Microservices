using System.Collections.Generic;

namespace Ecommerce.Services.Shippings.Api.Models.Entities;

public class District
{
    public long Id { get; set; }
    public long ProvinceId { get; set; }
    public string Name { get; set; } = string.Empty; // Clean name (e.g., "Ba Đình")
    public string DisplayName { get; set; } = string.Empty; // Display name with prefix (e.g., "Quận Ba Đình")

    public int? GhnId { get; set; }
    public string? GhtkId { get; set; }

    public Province Province { get; set; } = null!;
    public ICollection<Ward> Wards { get; set; } = new List<Ward>();
}
