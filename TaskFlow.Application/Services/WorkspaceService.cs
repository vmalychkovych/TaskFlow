using TaskFlow.Application.DTOs;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Services
{
    public class WorkspaceService : IWorkspaceService
    {
        private readonly IGenericRepository<Workspace> _workspaceRepository;

        public WorkspaceService(IGenericRepository<Workspace> workspaceRepository)
        {
            _workspaceRepository = workspaceRepository;
        }

        public async Task CreateWorkspaceAsync(CreateWorkspaceDto dto)
        {
            var workspace = new Workspace
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description
            };

            await _workspaceRepository.AddAsync(workspace);
            await _workspaceRepository.SaveChangesAsync();
        }

        public async Task<List<WorkspaceDto>> GetAllWorkspacesAsync()
        {
            var workspace = await _workspaceRepository.GetAllAsync();

            var result = workspace
                .Select(workspace => new WorkspaceDto
                {
                    Id = workspace.Id,
                    Name = workspace.Name,
                    Description = workspace.Description
                })
                .ToList();

            return result;
        }

        public async Task<WorkspaceDto?> GetWorkspaceByIdAsync(Guid id)
        {
            var workspace = await _workspaceRepository.GetByIdAsync(id);

            if (workspace == null)
            {
                return null;
            }

            return new WorkspaceDto
            {
                Id = workspace.Id,
                Name = workspace.Name,
                Description = workspace.Description
            };
        }

        public async Task<bool> UpdateWorkspaceAsync(Guid id, UpdateWorkspaceDto dto)
        {
            var workspace = await _workspaceRepository.GetByIdAsync(id);

            if (workspace == null)
            {
                return false;
            }

            workspace.Name = dto.Name;
            workspace.Description = dto.Description;

            _workspaceRepository.Update(workspace);
            await _workspaceRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteWorkspaceAsync(Guid id)
        {
            var workspace = await _workspaceRepository.GetByIdAsync(id);

            if (workspace == null)
            {
                return false;
            }

            _workspaceRepository.Delete(workspace);
            await _workspaceRepository.SaveChangesAsync();

            return true;
        }
    }
}
