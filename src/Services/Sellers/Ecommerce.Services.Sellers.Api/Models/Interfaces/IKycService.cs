using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Application.Commons.Models;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Sellers.Api.Models.Dtos;
using Ecommerce.Services.Sellers.Api.Models.Entities;

namespace Ecommerce.Services.Sellers.Api.Models.Interfaces;

public interface IKycService
{
    Task<Result<SellerKycDto>> SubmitKycAsync(long ownerUserId, SubmitKycRequest request);
    Task<Result<SellerKycDto>> GetKycByOwnerIdAsync(long ownerUserId);
    Task<Result<PagedResult<SellerKycDto>>> GetAdminKycsAsync(int pageNumber, int pageSize, KycStatus? status);
    Task<Result<SellerKycDto>> ApproveKycAsync(long kycId, long adminUserId);
    Task<Result<SellerKycDto>> RejectKycAsync(long kycId, string reason);
}

public record SubmitKycRequest(
    string FullName,
    string IdentityCardNumber,
    string IdCardFrontUrl,
    string IdCardBackUrl,
    string TaxNumber
);
