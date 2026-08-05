using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Sellers.Api.Models.Entities;

namespace Ecommerce.Services.Sellers.Api.Features.Kycs.Commands.RegisterKyc;

public record RegisterKycCommand(
    long UserId,
    string IdentityCardNumber,
    string IdentityCardFrontUrl,
    string IdentityCardBackUrl,
    bool IsDraft = false) : ICommand<SellerKyc>;
