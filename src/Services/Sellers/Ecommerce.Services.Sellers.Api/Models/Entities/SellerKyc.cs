using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Sellers.Api.Models.Entities;

public enum KycStatus
{
    Pending,
    Verified,
    Rejected
}

public class SellerKyc : EntityTrackingBase<Guid>
{
    public long UserId { get; set; }
    public string IdentityCardNumber { get; set; } = string.Empty;
    public KycStatus Status { get; set; } = KycStatus.Pending;
    public string? RejectReason { get; set; }
    
    public DateTimeOffset? VerifiedDate { get; set; }

    private SellerKyc() {}

    public SellerKyc(long userId, string identityCardNumber)
    {
        UserId = userId;
        IdentityCardNumber = identityCardNumber;
        Status = KycStatus.Pending;
    }

    public void Verify()
    {
        Status = KycStatus.Verified;
        VerifiedDate = DateTimeOffset.UtcNow;
    }

    public void Reject(string reason)
    {
        Status = KycStatus.Rejected;
        RejectReason = reason;
    }

    public void Resubmit(string identityCardNumber)
    {
        IdentityCardNumber = identityCardNumber;
        Status = KycStatus.Pending;
        RejectReason = null;
        VerifiedDate = null;
    }
}
