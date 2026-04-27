using TaskFlow.Application.DTOs;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace TaskFlow.Application.Services
{
    public class WorkspaceService : IWorkspaceService
    {
        private readonly IGenericRepository<Workspace> _workspaceRepository;

        public WorkspaceService(IGenericRepository<Workspace> workspaceRepository)
        {
            _workspaceRepository = workspaceRepository;
        }

        public async Task CreateWorkspaceAsync(CreateWorkspaceDto dto, string userId)
        {
            var workspace = new Workspace
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                OwnerId = userId
            };

            await _workspaceRepository.AddAsync(workspace);
            await _workspaceRepository.SaveChangesAsync();
        }

        public async Task<List<WorkspaceDto>> GetAllWorkspacesAsync(string userId)
        {
            var workspaces = await _workspaceRepository.Query()
                .Where(workspace => workspace.OwnerId == userId)
                .ToListAsync();

            return workspaces.Select(workspace => new WorkspaceDto
            {
                Id = workspace.Id,
                Name = workspace.Name,
                Description = workspace.Description
            }).ToList();
        }

        public async Task<WorkspaceDto?> GetWorkspaceByIdAsync(Guid id, string userId)
        {
            var workspace = await _workspaceRepository.Query()
                .FirstOrDefaultAsync(workspace => workspace.Id == id && workspace.OwnerId == userId);

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

        public async Task<bool> UpdateWorkspaceAsync(Guid id, UpdateWorkspaceDto dto, string userId)
        {
            var workspace = await _workspaceRepository.Query()
                .FirstOrDefaultAsync(workspace => workspace.Id == id && workspace.OwnerId == userId);

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

        public async Task<bool> DeleteWorkspaceAsync(Guid id, string userId)
        {
            var workspace = await _workspaceRepository.Query()
                .FirstOrDefaultAsync(workspace => workspace.Id == id && workspace.OwnerId == userId);

            if (workspace == null)
            {
                return false;
            }

            _workspaceRepository.Delete(workspace);
            await _workspaceRepository.SaveChangesAsync();

            return true;
        }


        public async Task<WorkspaceDetailsDto?> GetWorkspaceDetailsAsync(Guid id, string userId)
        {
            var workspace = await _workspaceRepository.Query()
                .Include(workspace => workspace.Projects)
                .ThenInclude(project => project.Tasks)
                .FirstOrDefaultAsync(workspace => workspace.Id == id && workspace.OwnerId == userId);

            if (workspace == null)
            {
                return null;
            }

            return new WorkspaceDetailsDto
            {
                Id = workspace.Id,
                Name = workspace.Name,
                Description = workspace.Description,
                Projects = workspace.Projects.Select(project => new ProjectDetailsDto
                {
                    Id = project.Id,
                    Name = project.Name,
                    Description = project.Description,
                    WorkspaceId = project.WorkspaceId,
                    Tasks = project.Tasks.Select(task => new TaskDto
                    {
                        Id = task.Id,
                        Title = task.Title,
                        Description = task.Description,
                        Priority = task.Priority.ToString(),
                        Status = task.Status.ToString(),
                        CreatedAt = task.CreatedAt
                    }).ToList()
                }).ToList()
            };
        }
    }
}
