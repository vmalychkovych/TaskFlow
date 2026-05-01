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
                    (workspace.OwnerId == userId ||
                     workspace.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == WorkspaceMemberStatus.Active)));

            if (!workspaceExists)
            {
                throw new NotFoundException("Workspace not found.");
            }

            var project = new Project
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                WorkspaceId = dto.WorkspaceId,
                Members =
                {
                    new ProjectMember
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Role = ProjectRole.ProjectAdmin,
                        Status = ProjectMemberStatus.Active,
                        AddedAt = DateTime.UtcNow
                    }
                }
            };

            await _projectRepository.AddAsync(project);
            await _projectRepository.SaveChangesAsync();
        }

        public async Task<List<ProjectDto>> GetAllProjectsAsync(string userId)
        {
            var projects = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .Where(project =>
                    project.Workspace.OwnerId == userId ||
                    project.Workspace.Members.Any(member =>
                        member.UserId == userId &&
                        member.Status == WorkspaceMemberStatus.Active &&
                        (member.Role == WorkspaceRole.Owner || member.Role == WorkspaceRole.Admin)) ||
                    project.Members.Any(member =>
                        member.UserId == userId &&
                        member.Status == ProjectMemberStatus.Active))
                .ToListAsync();

            return _mapper.Map<List<ProjectDto>>(projects);
        }

        public async Task<ProjectDto?> GetProjectByIdAsync(Guid id, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(project => project.Workspace)
                .Include(project => project.Members)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    (project.Workspace.OwnerId == userId ||
                     project.Workspace.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == WorkspaceMemberStatus.Active &&
                         (member.Role == WorkspaceRole.Owner || member.Role == WorkspaceRole.Admin)) ||
                     project.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == ProjectMemberStatus.Active)));

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
                .Include(project => project.Members)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    (project.Workspace.OwnerId == userId ||
                     project.Workspace.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == WorkspaceMemberStatus.Active &&
                         (member.Role == WorkspaceRole.Owner || member.Role == WorkspaceRole.Admin)) ||
                     project.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == ProjectMemberStatus.Active &&
                         member.Role == ProjectRole.ProjectAdmin)));

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
                .Include(project => project.Members)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    (project.Workspace.OwnerId == userId ||
                     project.Workspace.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == WorkspaceMemberStatus.Active &&
                         (member.Role == WorkspaceRole.Owner || member.Role == WorkspaceRole.Admin)) ||
                     project.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == ProjectMemberStatus.Active &&
                         member.Role == ProjectRole.ProjectAdmin)));

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
                .Include(project => project.Members)
                .Include(project => project.Tasks)
                .FirstOrDefaultAsync(project =>
                    project.Id == id &&
                    (project.Workspace.OwnerId == userId ||
                     project.Workspace.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == WorkspaceMemberStatus.Active &&
                         (member.Role == WorkspaceRole.Owner || member.Role == WorkspaceRole.Admin)) ||
                     project.Members.Any(member =>
                         member.UserId == userId &&
                         member.Status == ProjectMemberStatus.Active)));

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
    }
}
