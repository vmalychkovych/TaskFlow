using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TaskFlow.Application.Interfaces;
using TaskFlow.Application.Mappings;
using TaskFlow.Application.Services;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;
using TaskFlow.Infrastructure.Repositories;
using TaskFlow.WebAPI.Services;

namespace TaskFlow.WebAPI.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApplicationServices(
           this IServiceCollection services,
           IConfiguration configuration)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

            services.AddAutoMapper(typeof(MappingProfile).Assembly); 
            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            services.AddScoped<ITaskService, TaskService>();
            services.AddScoped<IProjectService, ProjectService>();
            services.AddScoped<IWorkspaceService, WorkspaceService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<ITaskCommentService, TaskCommentService>();
            services.AddScoped<IFileStorageService, MinioFileStorageService>();
            services.AddScoped<ITaskAttachmentService, TaskAttachmentService>();
            services.AddScoped<ICacheService, RedisCacheService>();
            services.AddIdentity<ApplicationUser, IdentityRole>()
                    .AddEntityFrameworkStores<ApplicationDbContext>()
                    .AddDefaultTokenProviders();
            services.AddScoped<INotificationService, SignalRNotificationService>();

            var jwtKey = configuration["Jwt:Key"];
            var jwtIssuer = configuration["Jwt:Issuer"];
            var jwtAudience = configuration["Jwt:Audience"];

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                // JWT validation must mirror the values used when tokens are issued.
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,

                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
                };
            });

            return services;
        }
    }
}
