
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Interfaces
{
    public interface IProjectService
    {
        Task CreateProjectAsync(CreateProjectDto dto);
        Task<List<ProjectDto>> GetAllProjectsAsync();
        Task<ProjectDto?> GetProjectByIdAsync(Guid id);

        Task<bool> UpdateProjectAsync(Guid id, UpdateProjectDto dto);
        Task<bool> DeleteProjectAsync(Guid id);
        Task<ProjectDetailsDto?> GetProjectDetailsAsync(Guid id);
    }
}
