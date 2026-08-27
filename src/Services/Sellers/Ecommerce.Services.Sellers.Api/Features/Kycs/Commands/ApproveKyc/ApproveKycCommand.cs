using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Sellers.Api.Features.Kycs.Commands.ApproveKyc;

public record ApproveKycCommand(long KycId) : ICommand;
