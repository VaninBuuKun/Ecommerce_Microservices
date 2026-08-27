using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using System.Collections.Generic;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SendDisputeMessage;

public record SendDisputeMessageCommand(
    long DisputeThreadId,
    long SenderUserId,
    string SenderRole, // Customer, Seller, Admin
    string Content,
    List<string>? AttachmentUrls = null
) : ICommand;
