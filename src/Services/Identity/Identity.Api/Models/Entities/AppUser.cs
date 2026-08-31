using System.ComponentModel.DataAnnotations.Schema;
using BuildingBlocks.Shared.Domains;
using BuildingBlocks.Shared.Domains.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace Ecommerce.Services.Identity.Api.Models.Entities;

public class AppUser : IdentityUser<long>, IDateTracking
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? AvatarUrl { get; set; }

    [NotMapped] public string FullName => $"{LastName} {FirstName}".Trim();
    [NotMapped] public string? Gender { get; set; } = "Female";
    [NotMapped] public DateTime? BirthDate { get; set; } = new DateTime(2000, 5, 2);
    
    public bool IsActive { get; set; } = true;
    
    //LockoutEnabled: True tức là tài khoản có thể bị khóa, False tức là không thể bị khóa (tài khoản này thường dùng cho trường hợp khẩn cấp, nếu bị block sẽ ảnh hưởng đến vận hàng hệ thống)
    public bool IsLockedOut() => LockoutEnabled && LockoutEnd.HasValue && LockoutEnd.Value > DateTimeOffset.UtcNow;
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? LastModifiedDate { get; set; }
}
