using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BuildingBlocks.Application.Commons.Models;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Dtos;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Ecommerce.Services.Sellers.Api.Persistances;
using Ecommerce.Services.Sellers.Api.Models.Interfaces;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Sellers.Api.Services;

public class KycService(
    SellerDbContext dbContext,
    IEfUnitOfWork unitOfWork,
    IMapper mapper) : IKycService
{
    private readonly IGenericEfRepository<SellerKyc, long> _kycRepository = unitOfWork.Repository<SellerKyc, long>();

    public async Task<Result<SellerKycDto>> SubmitKycAsync(long ownerUserId, SubmitKycRequest request)
    {
        var existingKyc = await _kycRepository.FirstOrDefaultAsync(k => k.UserId == ownerUserId);

        if (existingKyc != null && existingKyc.Status == KycStatus.Verified)
        {
            return Result<SellerKycDto>.Failure("Tài khoản đã được xác thực KYC thành công.");
        }

        if (existingKyc != null)
        {
            existingKyc.UpdateData(request.IdentityCardNumber, request.IdCardFrontUrl, request.IdCardBackUrl, false);
            _kycRepository.Update(existingKyc);
        }
        else
        {
            existingKyc = new SellerKyc(ownerUserId, request.IdentityCardNumber, request.IdCardFrontUrl, request.IdCardBackUrl, false);
            _kycRepository.Add(existingKyc);
        }

        await unitOfWork.SaveChangesAsync();
        return Result<SellerKycDto>.Success(mapper.Map<SellerKycDto>(existingKyc));
    }

    public async Task<Result<SellerKycDto>> GetKycByOwnerIdAsync(long ownerUserId)
    {
        var kyc = await _kycRepository.FirstOrDefaultAsync(k => k.UserId == ownerUserId);
        if (kyc == null)
            return Result<SellerKycDto>.Failure("Chưa có hồ sơ KYC.");

        return Result<SellerKycDto>.Success(mapper.Map<SellerKycDto>(kyc));
    }

    public async Task<Result<PagedResult<SellerKycDto>>> GetAdminKycsAsync(int pageNumber, int pageSize, KycStatus? status)
    {
        var query = dbContext.SellerKycs.AsQueryable();
        if (status.HasValue)
        {
            query = query.Where(k => k.Status == status.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query.OrderByDescending(k => k.CreatedDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = mapper.Map<List<SellerKycDto>>(items);
        return Result<PagedResult<SellerKycDto>>.Success(new PagedResult<SellerKycDto>(dtos, totalCount, pageNumber, pageSize));
    }

    public async Task<Result<SellerKycDto>> ApproveKycAsync(long kycId, long adminUserId)
    {
        var kyc = await _kycRepository.GetByIdAsync(kycId);
        if (kyc == null)
            return Result<SellerKycDto>.Failure("Hồ sơ KYC không tồn tại.");

        kyc.Verify();
        kyc.LastModifiedDate = DateTimeOffset.UtcNow;

        await unitOfWork.SaveChangesAsync();
        return Result<SellerKycDto>.Success(mapper.Map<SellerKycDto>(kyc));
    }

    public async Task<Result<SellerKycDto>> RejectKycAsync(long kycId, string reason)
    {
        var kyc = await _kycRepository.GetByIdAsync(kycId);
        if (kyc == null)
            return Result<SellerKycDto>.Failure("Hồ sơ KYC không tồn tại.");

        kyc.Reject(reason);
        kyc.LastModifiedDate = DateTimeOffset.UtcNow;

        await unitOfWork.SaveChangesAsync();
        return Result<SellerKycDto>.Success(mapper.Map<SellerKycDto>(kyc));
    }
}
