
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Interfaces
{
    public interface IProjectService
    {
        Task CreateProjectAsync(CreateProjectDto dto, string userId);
        Task<List<ProjectDto>> GetAllProjectsAsync(string userId);
        Task<ProjectDto?> GetProjectByIdAsync(Guid id, string userId);
        Task<bool> UpdateProjectAsync(Guid id, UpdateProjectDto dto, string userId);
        Task<bool> DeleteProjectAsync(Guid id, string userId);
        Task<ProjectDetailsDto?> GetProjectDetailsAsync(Guid id, string userId);
    }
}
