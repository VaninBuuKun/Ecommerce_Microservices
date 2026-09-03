using BuildingBlocks.Shared.Domains;
using BuildingBlocks.Shared.Domains.Interfaces;

namespace Ecommerce.Services.Catalog.Domain;

public class Banner : EntityBase<long>, IDateTracking
{
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? Badge { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string ButtonText { get; set; } = "Mua ngay";
    public string TargetUrl { get; set; } = "/products";
    public string ThemeGradient { get; set; } = "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700";
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? LastModifiedDate { get; set; }

    public Banner() { }

    public Banner(
        string title, 
        string? subtitle, 
        string? badge, 
        string imageUrl, 
        string buttonText, 
        string targetUrl, 
        string themeGradient, 
        int displayOrder, 
        bool isActive)
    {
        Title = title;
        Subtitle = subtitle;
        Badge = badge;
        ImageUrl = imageUrl;
        ButtonText = buttonText;
        TargetUrl = targetUrl;
        ThemeGradient = themeGradient;
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }

    public void Update(
        string title, 
        string? subtitle, 
        string? badge, 
        string imageUrl, 
        string buttonText, 
        string targetUrl, 
        string themeGradient, 
        int displayOrder, 
        bool isActive)
    {
        Title = title;
        Subtitle = subtitle;
        Badge = badge;
        ImageUrl = imageUrl;
        ButtonText = buttonText;
        TargetUrl = targetUrl;
        ThemeGradient = themeGradient;
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }

    public void ToggleStatus()
    {
        IsActive = !IsActive;
    }
}
