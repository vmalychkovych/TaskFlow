
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Interfaces
{
    public interface IWorkspaceService
    {
        Task CreateWorkspaceAsync(CreateWorkspaceDto dto);
        Task<List<WorkspaceDto>> GetAllWorkspacesAsync();
        Task<WorkspaceDto?> GetWorkspaceByIdAsync(Guid id);
        Task<WorkspaceDetailsDto?> GetWorkspaceWithDetailsByIdAsync(Guid id);
        Task<bool> UpdateWorkspaceAsync(Guid id, UpdateWorkspaceDto dto);
        Task<bool> DeleteWorkspaceAsync(Guid id);
    }
}
