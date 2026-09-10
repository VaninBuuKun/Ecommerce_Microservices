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
        var adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL") ?? "admin@gmail.com";
        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD")?? "password123";
        
        if (!string.IsNullOrWhiteSpace(adminPassword))
        {
            var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
            if (existingAdmin == null)
            {
                var adminUser = new AppUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FirstName = "Admin",
                    LastName = "Supe",
                    EmailConfirmed = true,
                    CreatedDate = DateTimeOffset.UtcNow,
                    AvatarUrl = "https://img.magnific.com/vector-mien-phi/hinh-minh-hoa-bieu-tuong-vector-hoat-hinh-hacker-de-thuong-dang-van-hanh-may-tinh-xach-tay-bieu-tuong-cong-nghe-moi-nguoi-bi-co-lap-phang_138676-7079.jpg?semt=ais_hybrid&w=740&q=80"
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
            else
            {
                Console.WriteLine($"ℹ️ Admin user '{adminEmail}' already exists. Skipping seed.");
            }
        }
        else
        {
            Console.WriteLine("⚠️ ADMIN_PASSWORD environment variable not set. Skipping admin user seed.");
        }

        // ===== 3. SEED NARUTO CHARACTERS (Customer/Staff) =====
        var narutoCharacters = new[]
        {
            new { FirstName = "Naruto", LastName = "Uzumaki", Email = "naruto@gmail.com", Role = "Customer" },
            new { FirstName = "Sasuke", LastName = "Uchiha", Email = "sasuke@gmail.com", Role = "Customer" },
            new { FirstName = "Sakura", LastName = "Haruno", Email = "sakura@gmail.com", Role = "Customer" },
            new { FirstName = "Kakashi", LastName = "Hatake", Email = "kakashi@gmail.com", Role = "Staff" },
            new { FirstName = "Hinata", LastName = "Hyuga", Email = "hinata@gmail.com", Role = "Customer" },
            new { FirstName = "Shikamaru", LastName = "Nara", Email = "shikamaru@gmail.com", Role = "Staff" },
            new { FirstName = "Gaara", LastName = "No Sabaku", Email = "gaara@gmail.com", Role = "Customer" },
            new { FirstName = "Jiraiya", LastName = "Sannin", Email = "jiraiya@gmail.com", Role = "Staff" },
            new { FirstName = "Itachi", LastName = "Uchiha", Email = "itachi@gmail.com", Role = "Customer" },
            new { FirstName = "Minato", LastName = "Namikaze", Email = "minato@gmail.com", Role = "Manager" },
            new { FirstName = "Tsunade", LastName = "Senju", Email = "tsunade@gmail.com", Role = "Customer" },
            new { FirstName = "Orochimaru", LastName = "Hebi", Email = "orochimaru@gmail.com", Role = "Customer" },
            new { FirstName = "Nagato", LastName = "Uzumaki", Email = "pain@gmail.com", Role = "Customer" },
            new { FirstName = "Konan", LastName = "Tenshi", Email = "konan@gmail.com", Role = "Customer" },
            new { FirstName = "Killer", LastName = "Bee", Email = "killerbee@gmail.com", Role = "Customer" },
            new { FirstName = "Tenten", LastName = "Ninja", Email = "tenten@gmail.com", Role = "Customer" },
            new { FirstName = "Kiba", LastName = "Inuzuka", Email = "kiba@gmail.com", Role = "Customer" },
            new { FirstName = "Rock", LastName = "Lee", Email = "rocklee@gmail.com", Role = "Customer" },
            new { FirstName = "Neji", LastName = "Hyuga", Email = "neji@gmail.com", Role = "Customer" },
            new { FirstName = "Madara", LastName = "Uchiha", Email = "madara@gmail.com", Role = "Customer" },
            new { FirstName = "Obito", LastName = "Uchiha", Email = "obito@gmail.com", Role = "Customer" }
        };

        foreach (var character in narutoCharacters)
        {
            var existingUser = await userManager.FindByEmailAsync(character.Email);
            if (existingUser != null) continue;

            var user = new AppUser
            {
                UserName = character.Email,
                Email = character.Email,
                FirstName = character.FirstName,
                LastName = character.LastName,
                EmailConfirmed = true,
                CreatedDate = DateTimeOffset.UtcNow,
                AvatarUrl = "https://thumbs.dreamstime.com/b/male-default-avatar-profile-icon-man-face-silhouette-person-placeholder-vector-illustration-male-default-avatar-profile-icon-man-189495143.jpg"
            };

            // Mật khẩu mặc định cho các tài khoản test là "password123"
            var createResult = await userManager.CreateAsync(user, "password123");
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(user, character.Role);
                Console.WriteLine($"✅ Character user '{character.Email}' ({character.FirstName} {character.LastName}) seeded with role '{character.Role}'.");
            }
            else
            {
                var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                Console.WriteLine($"❌ Failed to seed user '{character.Email}': {errors}");
            }
        }
    }
}