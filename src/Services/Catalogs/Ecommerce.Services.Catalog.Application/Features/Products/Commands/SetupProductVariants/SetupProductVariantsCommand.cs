using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using MapsterMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.SetupProductVariants;


public record SetupProductVariantsCommand(
    Guid ProductId,
    List<OptionSetupDto> Options,
    List<VariantSetupDto> Variants
) : ICommand<ProductResponse>;

public record OptionValueSetupDto(string Value);

public record OptionSetupDto(
    string Name,
    List<OptionValueSetupDto> Values
);

public record VariantOptionValueSetupDto(
    string OptionName,
    string ValueName
);

public record VariantSetupDto(
    string? Sku, 
    decimal Price, 
    int AvailableStocks, 
    List<VariantOptionValueSetupDto> OptionValues,
    double? Weight = null,
    double? Length = null,
    double? Width = null,
    double? Height = null
);
/*
{
    "Options": [
        {
            "Name": "Color",
            "Values": [
                {
                    "Name": "Red"
                },
                {
                    "Name": "Blue"
                }
            ]
        },
        {
            "Name": "Size",
            "Values": [
                {
                    "Name": "S"
                },
                {
                    "Name": "M"
                },
                {
                    "Name": "L"
                }
            ]
        }
    ],
    "Variants": [
        {
            "OptionValues": [
                {
                    "OptionName": "Color",
                    "ValueName": "Red"
                },
                {
                    "OptionName": "Size",
                    "ValueName": "S"
                }
            ],
            "Sku": "SKU-RED-S",
            "Price": 100.0,
            "AvailableStocks": 10,

        }
        ]
    ]
}
*/
