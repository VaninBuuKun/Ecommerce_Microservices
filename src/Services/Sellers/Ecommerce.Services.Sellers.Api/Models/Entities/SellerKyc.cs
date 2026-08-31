using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Sellers.Api.Models.Entities;

public enum KycStatus
{
    Draft = 0,
    Submitted = 1,
    Verified = 2,
    Rejected = 3
}

public class SellerKyc : EntityTrackingBase<long>
{
    public long UserId { get; set; }
    public string IdentityCardNumber { get; set; } = string.Empty;
    public string IdentityCardFrontUrl { get; set; } = string.Empty;
    public string IdentityCardBackUrl { get; set; } = string.Empty;
    public KycStatus Status { get; set; } = KycStatus.Draft;
    public string? RejectReason { get; set; }
    
    public DateTimeOffset? VerifiedDate { get; set; }

    private SellerKyc() {}

    public SellerKyc(long userId, string identityCardNumber, string identityCardFrontUrl, string identityCardBackUrl, bool isDraft = false)
    {
        UserId = userId;
        IdentityCardNumber = identityCardNumber;
        IdentityCardFrontUrl = identityCardFrontUrl;
        IdentityCardBackUrl = identityCardBackUrl;
        Status = isDraft ? KycStatus.Draft : KycStatus.Submitted;
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

    public void UpdateData(string identityCardNumber, string identityCardFrontUrl, string identityCardBackUrl, bool isDraft)
    {
        IdentityCardNumber = identityCardNumber;
        IdentityCardFrontUrl = identityCardFrontUrl;
        IdentityCardBackUrl = identityCardBackUrl;
        Status = isDraft ? KycStatus.Draft : KycStatus.Submitted;
        RejectReason = null;
        VerifiedDate = null;
    }

    public void WithdrawToDraft()
    {
        Status = KycStatus.Draft;
    }

    public void Resubmit(string identityCardNumber, string identityCardFrontUrl, string identityCardBackUrl, bool isDraft = false)
    {
        UpdateData(identityCardNumber, identityCardFrontUrl, identityCardBackUrl, isDraft);
    }
}
