using System.Threading.Tasks;
using Ecommerce.Services.Catalog.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Services.Catalog.Api.Controllers;

[ApiController]
[Route("api/dev")]
public class DevController(CatalogDataSeeder seeder) : ControllerBase
{
    [HttpPost("seed")]
    public async Task<IActionResult> SeedData([FromQuery] bool reset = false, [FromQuery] int limitPerFile = 30)
    {
        await seeder.SeedAsync(reset, limitPerFile);
        return Ok(new { message = $"Dữ liệu Catalog đã được seed thành công với Snowflake ID chuẩn ({limitPerFile} sản phẩm mỗi danh mục)." });
    }
}
