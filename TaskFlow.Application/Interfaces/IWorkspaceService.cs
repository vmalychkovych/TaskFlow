
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Interfaces
{
    public interface IWorkspaceService
    {
        Task CreateWorkspaceAsync(CreateWorkspaceDto dto, string userId);
        Task<List<WorkspaceDto>> GetAllWorkspacesAsync(string userId);
        Task<WorkspaceDto?> GetWorkspaceByIdAsync(Guid id, string userId);
        Task<bool> UpdateWorkspaceAsync(Guid id, UpdateWorkspaceDto dto, string userId);
        Task<bool> DeleteWorkspaceAsync(Guid id, string userId);
        Task<WorkspaceDetailsDto?> GetWorkspaceDetailsAsync(Guid id, string userId);
    }
}
