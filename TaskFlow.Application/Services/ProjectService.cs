using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Exceptions;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Services
{
    public class ProjectService : IProjectService
    {
        private readonly IGenericRepository<Project> _projectRepository;
        private readonly IGenericRepository<Workspace> _workspaceRepository;
        private readonly IMapper _mapper;

        public ProjectService(
            IGenericRepository<Project> projectRepository,
            IGenericRepository<Workspace> workspaceRepository,
            IMapper mapper)
        {
            _projectRepository = projectRepository;
            _workspaceRepository = workspaceRepository;
            _mapper = mapper;
        }

        public async Task CreateProjectAsync(CreateProjectDto dto, string userId)
        {
            var workspaceExists = await _workspaceRepository.Query()
                .AnyAsync(workspace =>
                    workspace.Id == dto.WorkspaceId &&
                    HasWorkspaceAccess(workspace, userId));

            if (!workspaceExists)
            {
                throw new NotFoundException("Workspace not found.");
            }

            var project = new Project
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                WorkspaceId = dto.WorkspaceId
            };

            await _projectRepository.AddAsync(project);
            await _projectRepository.SaveChangesAsync();
        }

        public async Task<List<ProjectDto>> GetAllProjectsAsync(string userId)
        {
            var projects = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .Where(project => HasWorkspaceAccess(project.Workspace, userId))
                .ToListAsync();

            return _mapper.Map<List<ProjectDto>>(projects);
        }

        public async Task<ProjectDto?> GetProjectByIdAsync(Guid id, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    HasWorkspaceAccess(project.Workspace, userId));

            if (project == null)
            {
                return null;
            }

            return _mapper.Map<ProjectDto>(project);
        }

        public async Task<bool> UpdateProjectAsync(Guid id, UpdateProjectDto dto, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    HasWorkspaceAccess(project.Workspace, userId));

            if (project == null)
            {
                return false;
            }

            project.Name = dto.Name;
            project.Description = dto.Description;

            _projectRepository.Update(project);
            await _projectRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteProjectAsync(Guid id, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    HasWorkspaceAccess(project.Workspace, userId));

            if (project == null)
            {
                return false;
            }

            _projectRepository.Delete(project);
            await _projectRepository.SaveChangesAsync();

            return true;
        }

        public async Task<ProjectDetailsDto?> GetProjectDetailsAsync(Guid id, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .Include(project => project.Tasks)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    HasWorkspaceAccess(project.Workspace, userId));

            if (project == null)
            {
                return null;
            }

            return new ProjectDetailsDto
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                WorkspaceId = project.WorkspaceId,
                Tasks = _mapper.Map<List<TaskDto>>(project.Tasks)
            };
        }

        private static bool HasWorkspaceAccess(Workspace workspace, string userId)
        {
            return workspace.OwnerId == userId ||
                   workspace.Members.Any(member =>
                       member.UserId == userId &&
                       member.Status == WorkspaceMemberStatus.Active);
        }
    }
}
