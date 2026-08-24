using Ecommerce.Services.Identity.Api.Models.Entities;
using Microsoft.AspNetCore.Identity;

namespace Identity.Extensions;

public static class SeedDataExtensions
{
    public static async Task SeedUserAndRoleAsync(
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole<long>> roleManager)
    {
        // ===== 1. SEED ROLES (Idempotent — kiểm tra từng role bằng FindByNameAsync) =====
        var requiredRoles = new[] { "Admin", "Customer", "Manager", "Staff"};
        foreach (var roleName in requiredRoles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var roleResult = await roleManager.CreateAsync(new IdentityRole<long>(roleName));
                if (roleResult.Succeeded)
                    Console.WriteLine($"✅ Role '{roleName}' created.");
                else
                    Console.WriteLine($"❌ Failed to create role '{roleName}': {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
            }
        }

        // ===== 2. SEED ADMIN USER (Idempotent + Secure — Password từ ENV) =====
        var adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL") ?? "admin@ecommerce.com";
        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");

        if (string.IsNullOrWhiteSpace(adminPassword))
        {
            Console.WriteLine("⚠️ ADMIN_PASSWORD environment variable not set. Skipping admin user seed.");
            Console.WriteLine("   Set ADMIN_PASSWORD in docker-compose.yml or .env file to seed admin user.");
            return;
        }

        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
        if (existingAdmin != null)
        {
            Console.WriteLine($"ℹ️ Admin user '{adminEmail}' already exists. Skipping seed.");
            return;
        }

        var adminUser = new AppUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            FirstName = "System",
            LastName = "Admin",
            EmailConfirmed = true,
            CreatedDate = DateTimeOffset.UtcNow
        };

        var result = await userManager.CreateAsync(adminUser, adminPassword);
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
            Console.WriteLine($"✅ Admin user '{adminEmail}' seeded successfully.");
        }
        else
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            Console.WriteLine($"❌ Failed to seed admin user: {errors}");
        }
    }
}