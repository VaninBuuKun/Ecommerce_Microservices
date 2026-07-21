using System.Collections.Generic;

namespace Ecommerce.Services.Shippings.Api.Models.Entities;

public class Province
{
    public string Id { get; set; } = string.Empty; // GSO Code as Primary Key
    public string Name { get; set; } = string.Empty; // Clean name for search/matching (e.g., "Hồ Chí Minh")
    public string DisplayName { get; set; } = string.Empty; // Display name with prefix (e.g., "Thành phố Hồ Chí Minh")

    public int? GhnId { get; set; }
    public string? GhtkId { get; set; }

    public ICollection<District> Districts { get; set; } = new List<District>();
}
