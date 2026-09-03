using System;

namespace Ecommerce.Services.Identity.Api.Models.Entities;

public class UserKnownDevice
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public AppUser User { get; set; } = null!;

    public string DeviceHash { get; set; } = string.Empty; // SHA256 của Fingerprint
    public string DeviceName { get; set; } = string.Empty; // VD: Chrome trên Windows
    public string LastIpAddress { get; set; } = string.Empty;
    public DateTimeOffset FirstSeenAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset LastLoginAt { get; set; } = DateTimeOffset.UtcNow;
}
