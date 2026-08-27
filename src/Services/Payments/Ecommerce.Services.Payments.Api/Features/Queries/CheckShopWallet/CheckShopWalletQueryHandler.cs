using System;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Payments.Api.Models.Entities;
using MediatR;

namespace Ecommerce.Services.Payments.Api.Features.Queries.CheckShopWallet;

public class CheckShopWalletQueryHandler(IEfUnitOfWork unitOfWork) 
    : IRequestHandler<CheckShopWalletQuery, Result<ShopWalletDto>>
{
    public async Task<Result<ShopWalletDto>> Handle(CheckShopWalletQuery request, CancellationToken cancellationToken)
    {
        var walletRepo = unitOfWork.Repository<Wallet, long>();
        var wallet = await walletRepo.FirstOrDefaultAsync(w => w.UserId == request.UserId);
        
        if (wallet == null)
        {
            return Result<ShopWalletDto>.Success(new ShopWalletDto(false, false, "0"));
        }

        var balanceStr = wallet.Balance.ToString(CultureInfo.InvariantCulture);
        return Result<ShopWalletDto>.Success(new ShopWalletDto(true, wallet.IsLocked, balanceStr));
    }
}
