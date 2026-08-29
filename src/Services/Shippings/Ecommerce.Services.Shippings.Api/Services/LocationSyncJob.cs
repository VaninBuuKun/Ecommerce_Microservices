using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Ecommerce.Services.Shippings.Api.Models.Entities;
using Ecommerce.Services.Shippings.Api.Persistances;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Shippings.Api.Services;

public class LocationSyncJob(
    IServiceProvider serviceProvider,
    IConfiguration configuration,
    ILogger<LocationSyncJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("LocationSyncJob is starting...");

        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        try
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ShippingDbContext>();
            var httpClient = scope.ServiceProvider.GetRequiredService<HttpClient>();

            var token = configuration["ShippingProviders:GHN:Token"] ?? "MOCK_TOKEN";

            logger.LogInformation("LocationSyncJob: Starting administrative division seeding from locations.json...");
            await SeedStandardLocationsFromJsonAsync(dbContext);

            if (string.IsNullOrEmpty(token) || token == "MOCK_TOKEN" || token == "MOCK_GHN_SANDBOX_TOKEN")
            {
                logger.LogInformation("LocationSyncJob: Token not configured. Applying mock mappings.");
                await ApplyMockGhnMappingsAsync(dbContext);
            }
            else
            {
                try
                {
                    logger.LogInformation("LocationSyncJob: Fetching real mappings from GHN API...");
                    await SyncRealGhnMappingsAsync(dbContext, httpClient, token, stoppingToken);
                }
                catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Unauthorized || ex.StatusCode == System.Net.HttpStatusCode.Forbidden)
                {
                    logger.LogWarning("LocationSyncJob: GHN API Token is unauthorized or invalid (401/403). Falling back to mock mappings for local development.");
                    await ApplyMockGhnMappingsAsync(dbContext);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "LocationSyncJob: Error occurred during background location sync");
        }
    }

    private async Task SeedStandardLocationsFromJsonAsync(ShippingDbContext dbContext)
    {
        logger.LogInformation("LocationSyncJob: Resetting existing location data in database...");
        
        // Xóa theo thứ tự ngược lại từ Ward -> District -> Province để tránh lỗi khóa ngoại (Foreign Key)
        dbContext.Wards.RemoveRange(dbContext.Wards);
        dbContext.Districts.RemoveRange(dbContext.Districts);
        dbContext.Provinces.RemoveRange(dbContext.Provinces);
        await dbContext.SaveChangesAsync();

        var jsonPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "locations.json");
        if (!File.Exists(jsonPath))
        {
            jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "locations.json");
        }

        if (!File.Exists(jsonPath))
        {
            logger.LogWarning("LocationSyncJob: locations.json not found at {Path}. Skipping seed.", jsonPath);
            return;
        }

        var jsonText = await File.ReadAllTextAsync(jsonPath);
        var provincesArray = JsonNode.Parse(jsonText)?.AsArray();
        if (provincesArray == null) return;

        int totalProvinces = 0, totalDistricts = 0, totalWards = 0;

        foreach (var pNode in provincesArray)
        {
            if (pNode == null) continue;
            var rawProvName = pNode["name"]?.GetValue<string>() ?? "";
            
            var province = new Province 
            { 
                Name = CleanLocationName(rawProvName),
                DisplayName = rawProvName
            };
            
            dbContext.Provinces.Add(province);
            await dbContext.SaveChangesAsync(); // Lưu ngay để EF sinh ra Province.Id tự tăng
            totalProvinces++;

            var districtsArray = pNode["districts"]?.AsArray();
            if (districtsArray == null) continue;

            foreach (var dNode in districtsArray)
            {
                if (dNode == null) continue;
                var rawDistName = dNode["name"]?.GetValue<string>() ?? "";

                var district = new District 
                { 
                    ProvinceId = province.Id, // Lấy ID vừa được sinh tự động
                    Name = CleanLocationName(rawDistName),
                    DisplayName = rawDistName
                };
                
                dbContext.Districts.Add(district);
                await dbContext.SaveChangesAsync(); // Lưu ngay để sinh ra District.Id tự tăng
                totalDistricts++;

                var wardsArray = dNode["wards"]?.AsArray();
                if (wardsArray == null) continue;

                var wards = new List<Ward>();
                foreach (var wNode in wardsArray)
                {
                    if (wNode == null) continue;
                    var rawWardName = wNode["name"]?.GetValue<string>() ?? "";

                    wards.Add(new Ward 
                    { 
                        DistrictId = district.Id, // Lấy ID vừa được sinh tự động
                        Name = CleanLocationName(rawWardName),
                        DisplayName = rawWardName
                    });
                    totalWards++;
                }

                if (wards.Count > 0)
                {
                    dbContext.Wards.AddRange(wards);
                    await dbContext.SaveChangesAsync();
                }
            }
        }

        logger.LogInformation("LocationSyncJob: Standard address catalog seeded from locations.json. Total Provinces: {P}, Districts: {D}, Wards: {W}", totalProvinces, totalDistricts, totalWards);
    }

    private string CleanLocationName(string name)
    {
        return name
            .Replace("Thành phố", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Tỉnh", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Quận", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Huyện", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Thị xã", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Phường", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Xã", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Thị trấn", "", StringComparison.OrdinalIgnoreCase)
            .Trim();
    }

    private string GetComparisonKey(string name)
    {
        if (string.IsNullOrEmpty(name)) return "";
        
        return name.ToLower()
            .Replace("thành phố", "", StringComparison.OrdinalIgnoreCase)
            .Replace("tỉnh", "", StringComparison.OrdinalIgnoreCase)
            .Replace("quận", "", StringComparison.OrdinalIgnoreCase)
            .Replace("huyện", "", StringComparison.OrdinalIgnoreCase)
            .Replace("thị xã", "", StringComparison.OrdinalIgnoreCase)
            .Replace("phường", "", StringComparison.OrdinalIgnoreCase)
            .Replace("xã", "", StringComparison.OrdinalIgnoreCase)
            .Replace("thị trấn", "", StringComparison.OrdinalIgnoreCase)
            .Replace("-", " ")
            .Replace("đ", "d")
            .Replace("ă", "a")
            .Replace("â", "a")
            .Replace("á", "a")
            .Replace("à", "a")
            .Replace("ả", "a")
            .Replace("ã", "a")
            .Replace("ạ", "a")
            .Replace("é", "e")
            .Replace("è", "e")
            .Replace("ẻ", "e")
            .Replace("ẽ", "e")
            .Replace("ẹ", "e")
            .Replace("í", "i")
            .Replace("ì", "i")
            .Replace("ỉ", "i")
            .Replace("ĩ", "i")
            .Replace("ị", "i")
            .Replace("ó", "o")
            .Replace("ò", "o")
            .Replace("ỏ", "o")
            .Replace("õ", "o")
            .Replace("ọ", "o")
            .Replace("ú", "u")
            .Replace("ù", "u")
            .Replace("ủ", "u")
            .Replace("ũ", "u")
            .Replace("ụ", "u")
            .Replace("ý", "y")
            .Replace("ỳ", "y")
            .Replace("ỷ", "y")
            .Replace("ỹ", "y")
            .Replace("ỵ", "y")
            .Replace(" ", "")
            .Trim();
    }

    private async Task ApplyMockGhnMappingsAsync(ShippingDbContext dbContext)
    {
        var hn = await dbContext.Provinces.FirstOrDefaultAsync(x => x.Name.Contains("Hà Nội"));
        if (hn != null) { hn.GhnId = 201; hn.GhtkId = "HN"; }

        var hcm = await dbContext.Provinces.FirstOrDefaultAsync(x => x.Name.Contains("Hồ Chí Minh"));
        if (hcm != null) { hcm.GhnId = 202; hcm.GhtkId = "HCM"; }

        var q1 = await dbContext.Districts.FirstOrDefaultAsync(x => x.Name.Contains("Quận 1") || x.Name == "1");
        if (q1 != null) { q1.GhnId = 1442; q1.GhtkId = "Q.1"; }

        var bd = await dbContext.Districts.FirstOrDefaultAsync(x => x.Name.Contains("Ba Đình") || x.Name == "Ba Đình");
        if (bd != null) { bd.GhnId = 1482; bd.GhtkId = "Q.Ba Dinh"; }

        var cg = await dbContext.Districts.FirstOrDefaultAsync(x => x.Name.Contains("Cầu Giấy") || x.Name == "Cầu Giấy");
        if (cg != null) { cg.GhnId = 1485; cg.GhtkId = "Q.Cau Giay"; }

        var bn = await dbContext.Wards.FirstOrDefaultAsync(x => x.Name.Contains("Bến Nghé") || x.Name == "Bến Nghé");
        if (bn != null) { bn.GhnCode = "20002"; bn.GhtkCode = "P.Ben Nghe"; }

        var dv = await dbContext.Wards.FirstOrDefaultAsync(x => x.Name.Contains("Dịch Vọng") || x.Name == "Dịch Vọng");
        if (dv != null) { dv.GhnCode = "1A0307"; dv.GhtkCode = "P.Dich Vong"; }

        await dbContext.SaveChangesAsync();
        logger.LogInformation("LocationSyncJob: Mock GHN mappings applied successfully.");
    }

    private async Task SyncRealGhnMappingsAsync(ShippingDbContext dbContext, HttpClient httpClient, string token, CancellationToken cancellationToken)
    {
        httpClient.DefaultRequestHeaders.Clear();
        httpClient.DefaultRequestHeaders.Add("Token", token);

        // 1. Ánh xạ các Tỉnh
        var provinces = await dbContext.Provinces.ToListAsync(cancellationToken);
        var ghnProvincesNode = await httpClient.GetFromJsonAsync<JsonNode>("https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province", cancellationToken);
        var ghnProvinces = ghnProvincesNode?["data"]?.AsArray();

        if (ghnProvinces != null)
        {
            foreach (var province in provinces)
            {
                var cleanProvName = GetComparisonKey(province.Name);
                bool matched = false;
                
                foreach (var ghnP in ghnProvinces)
                {
                    var ghnProvName = GetComparisonKey(ghnP?["ProvinceName"]?.GetValue<string>() ?? "");
                    if (cleanProvName == ghnProvName)
                    {
                        province.GhnId = ghnP["ProvinceID"]?.GetValue<int>();
                        matched = true;
                        break;
                    }
                }

                if (!matched)
                {
                    foreach (var ghnP in ghnProvinces)
                    {
                        var ghnProvName = GetComparisonKey(ghnP?["ProvinceName"]?.GetValue<string>() ?? "");
                        if (ghnProvName.Contains(cleanProvName) || cleanProvName.Contains(ghnProvName))
                        {
                            province.GhnId = ghnP["ProvinceID"]?.GetValue<int>();
                            break;
                        }
                    }
                }
            }
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        // 2. Ánh xạ các Quận
        var mappedProvinces = provinces.Where(p => p.GhnId != null).ToList();
        logger.LogInformation("LocationSyncJob: Syncing districts for {Count} mapped provinces...", mappedProvinces.Count);
        
        foreach (var province in mappedProvinces)
        {
            await Task.Delay(100, cancellationToken);
            var response = await httpClient.PostAsJsonAsync(
                "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district", 
                new { province_id = province.GhnId!.Value },
                cancellationToken
            );
            
            if (!response.IsSuccessStatusCode) continue;
            
            var jsonNode = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
            var ghnDistricts = jsonNode?["data"]?.AsArray();
            if (ghnDistricts == null) continue;

            var dbDistricts = await dbContext.Districts
                .Where(d => d.ProvinceId == province.Id)
                .ToListAsync(cancellationToken);

            foreach (var district in dbDistricts)
            {
                var cleanDistName = GetComparisonKey(district.Name);
                bool matched = false;
                
                foreach (var ghnD in ghnDistricts)
                {
                    var ghnDistName = GetComparisonKey(ghnD?["DistrictName"]?.GetValue<string>() ?? "");
                    if (cleanDistName == ghnDistName)
                    {
                        district.GhnId = ghnD["DistrictID"]?.GetValue<int>();
                        matched = true;
                        break;
                    }
                }

                if (!matched)
                {
                    foreach (var ghnD in ghnDistricts)
                    {
                        var ghnDistName = GetComparisonKey(ghnD?["DistrictName"]?.GetValue<string>() ?? "");
                        if (ghnDistName.Contains(cleanDistName) || cleanDistName.Contains(ghnDistName))
                        {
                            district.GhnId = ghnD["DistrictID"]?.GetValue<int>();
                            break;
                        }
                    }
                }
            }
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        // 3. Ánh xạ các Phường/Xã
        var mappedDistricts = await dbContext.Districts.Where(d => d.GhnId != null).ToListAsync(cancellationToken);
        logger.LogInformation("LocationSyncJob: Syncing wards for {Count} mapped districts...", mappedDistricts.Count);

        foreach (var district in mappedDistricts)
        {
            await Task.Delay(100, cancellationToken);
            var response = await httpClient.PostAsJsonAsync(
                "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward", 
                new { district_id = district.GhnId!.Value },
                cancellationToken
            );
            
            if (!response.IsSuccessStatusCode) continue;

            var jsonNode = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
            var ghnWards = jsonNode?["data"]?.AsArray();
            if (ghnWards == null) continue;

            var dbWards = await dbContext.Wards
                .Where(w => w.DistrictId == district.Id)
                .ToListAsync(cancellationToken);

            foreach (var ward in dbWards)
            {
                var cleanWardName = GetComparisonKey(ward.Name);
                bool matched = false;
                
                foreach (var ghnW in ghnWards)
                {
                    var ghnWardName = GetComparisonKey(ghnW?["WardName"]?.GetValue<string>() ?? "");
                    if (cleanWardName == ghnWardName)
                    {
                        ward.GhnCode = ghnW["WardCode"]?.GetValue<string>();
                        matched = true;
                        break;
                    }
                }

                if (!matched)
                {
                    foreach (var ghnW in ghnWards)
                    {
                        var ghnWardName = GetComparisonKey(ghnW?["WardName"]?.GetValue<string>() ?? "");
                        if (ghnWardName.Contains(cleanWardName) || cleanWardName.Contains(ghnWardName))
                        {
                            ward.GhnCode = ghnW["WardCode"]?.GetValue<string>();
                            break;
                        }
                    }
                }
            }
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        logger.LogInformation("LocationSyncJob: Real mappings successfully fetched and synced.");
    }
}
