using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetMyProducts;

public class GetMyProductsQueryHandler(IEfUnitOfWork unitOfWork, ISellerService sellerService) : CommandHandler<GetMyProductsQuery, List<MyProductDto>>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();
    protected override async Task<Result<List<MyProductDto>>> HandleCommandAsync(GetMyProductsQuery command, CancellationToken cancellationToken)
    {
        try
        {
            var IsOwnerResult = await sellerService.ValidateShopOwnerAsync(command.ShopId, command.UserId);

            if (!IsOwnerResult.IsSuccess)
            {
                return Result<List<MyProductDto>>.Failure(IsOwnerResult);
            }

            if (!IsOwnerResult.Value)
            {
                return Result<List<MyProductDto>>.Failure("Bạn không có quyền truy cập vào danh sách sản phẩm của cửa hàng này.", EErrorCode.Forbidden);
            }
            
            var spec = new ProductTreeSpec(command.ShopId, command.pageSize, command.page, command.searchTerm ?? "");
            var products = await _productRepository.GetListAsync(spec, cancellationToken);

            
            var response = new List<MyProductDto>();
            foreach (var product in products)
            {
                //San pham vua tao.
                if (product.Variants.Count == 0)
                {
                    response.Add(new MyProductDto
                    {
                        Id = product.Id,
                        Name = product.Name,
                        Description = product.Description,
                        ThumbnailUrl = product.ThumbnailUrl,
                        Price = product.Price,
                        DiscountPrice = product.DiscountPrice,
                        AvailableStock = 0,
                        Status = product.Status == ProductStatus.Active ? "Active" : "Inactive",
                    });
                }
                else if (product.Variants.Count == 1 && product.Variants.First().VariantOptions.Count == 0)
                {
                    var variant = product.Variants.First();
                    response.Add(new MyProductDto
                    {
                        Id = product.Id,
                        Name = product.Name,
                        Description = product.Description,
                        ThumbnailUrl = product.ThumbnailUrl,
                        Price = product.Price,
                        DiscountPrice = product.DiscountPrice,
                        AvailableStock = variant.AvailableStock,
                        Status = product.Status == ProductStatus.Active ? "Active" : "Inactive",
                    });
                }
                else
                {
                    response.Add(new MyProductDto
                    {
                        Id = product.Id,
                        Name = product.Name,
                        Description = product.Description,
                        ThumbnailUrl = product.ThumbnailUrl,
                        Price = product.Price,
                        DiscountPrice = product.DiscountPrice,
                        AvailableStock = product.Variants.Sum(v => v.AvailableStock),
                        Status = product.Status == ProductStatus.Active ? "Active" : "Inactive",
                        Variants = product.Variants
                            .OrderBy(v => v.VariantOptions
                                .OrderBy(vo => vo.OptionValue.Option.SortOrder)
                                .Select(vo => vo.OptionValue.SortOrder)
                                .FirstOrDefault())
                            .ThenBy(v => v.VariantOptions
                                .OrderBy(vo => vo.OptionValue.Option.SortOrder)
                                .Skip(1)
                                .Select(vo => vo.OptionValue.SortOrder)
                                .FirstOrDefault())
                            .Select(v => new MyVariantDto
                            {
                                VariantName = v.GetVariantName(),
                                Price = v.Price,
                                AvailableStock = v.AvailableStock,
                                ThumbnailUrl = v.VariantOptions
                                    .OrderBy(vo => vo.OptionValue.Option.SortOrder)
                                    .Select(vo => vo.OptionValue.ImageUrl)
                                    .FirstOrDefault(url => !string.IsNullOrEmpty(url)) ?? product.ThumbnailUrl ?? ""
                            }).ToList()
                    });
                }
            }
            
            return Result<List<MyProductDto>>.Success(response);
        }
        catch (Exception ex)
        {
            return Result<List<MyProductDto>>.Failure($"Lỗi khi lấy danh sách sản phẩm của người dùng {command.UserId}: {ex.Message}");
        }
    }
}