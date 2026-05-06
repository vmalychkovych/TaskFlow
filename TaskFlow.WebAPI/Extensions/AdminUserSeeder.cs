using Microsoft.AspNetCore.Identity;
using TaskFlow.Domain.Entities;

namespace TaskFlow.WebAPI.Extensions
{
    public static class AdminUserSeeder
    {
        public static async Task SeedAdminAsync(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var passwordHasher = serviceProvider.GetRequiredService<IPasswordHasher<ApplicationUser>>();

            var adminUser = await userManager.FindByNameAsync("admin")
                ?? await userManager.FindByEmailAsync("admin@taskflow.local");

            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    Id = Guid.NewGuid().ToString(),
                    UserName = "admin",
                    Email = "admin@taskflow.local",
                    FirstName = "System",
                    LastName = "Admin",
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                };

                adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "admin");

                var createResult = await userManager.CreateAsync(adminUser);

                if (!createResult.Succeeded)
                {
                    var errors = string.Join("; ", createResult.Errors.Select(error => error.Description));
                    throw new InvalidOperationException($"Unable to create seeded admin user: {errors}");
                }
            }

            if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
            {
                var roleResult = await userManager.AddToRoleAsync(adminUser, "Admin");

                if (!roleResult.Succeeded)
                {
                    var errors = string.Join("; ", roleResult.Errors.Select(error => error.Description));
                    throw new InvalidOperationException($"Unable to assign Admin role to seeded admin user: {errors}");
                }
            }

            if (!await userManager.IsInRoleAsync(adminUser, "User"))
            {
                var roleResult = await userManager.AddToRoleAsync(adminUser, "User");

                if (!roleResult.Succeeded)
                {
                    var errors = string.Join("; ", roleResult.Errors.Select(error => error.Description));
                    throw new InvalidOperationException($"Unable to assign User role to seeded admin user: {errors}");
                }
            }
        }
    }
}
