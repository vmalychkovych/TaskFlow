using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Interfaces
{
    public interface IProjectDiscordIntegrationService
    {
        Task<ProjectDiscordIntegrationDto?> GetAsync(Guid projectId, string userId);
        Task<ProjectDiscordIntegrationDto> UpsertAsync(Guid projectId, ConfigureProjectDiscordDto dto, string userId);
        Task<bool> DeleteAsync(Guid projectId, string userId);
    }
}
