using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Exceptions;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Services
{
    public class ProjectDiscordIntegrationService : IProjectDiscordIntegrationService
    {
        private readonly IGenericRepository<Project> _projectRepository;
        private readonly IGenericRepository<ProjectDiscordIntegration> _integrationRepository;

        public ProjectDiscordIntegrationService(
            IGenericRepository<Project> projectRepository,
            IGenericRepository<ProjectDiscordIntegration> integrationRepository)
        {
            _projectRepository = projectRepository;
            _integrationRepository = integrationRepository;
        }

        public async Task<ProjectDiscordIntegrationDto?> GetAsync(Guid projectId, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(currentProject => currentProject.Workspace)
                .ThenInclude(workspace => workspace.Members)
                .Include(currentProject => currentProject.Members)
                .Include(currentProject => currentProject.DiscordIntegration)
                .FirstOrDefaultAsync(currentProject =>
                    currentProject.Id == projectId &&
                    HasProjectAccess(currentProject, userId));

            if (project == null)
            {
                return null;
            }

            return project.DiscordIntegration == null
                ? null
                : Map(project.DiscordIntegration);
        }

        public async Task<ProjectDiscordIntegrationDto> UpsertAsync(Guid projectId, ConfigureProjectDiscordDto dto, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(currentProject => currentProject.Workspace)
                .ThenInclude(workspace => workspace.Members)
                .Include(currentProject => currentProject.Members)
                .Include(currentProject => currentProject.DiscordIntegration)
                .FirstOrDefaultAsync(currentProject =>
                    currentProject.Id == projectId &&
                    CanManageProject(currentProject, userId));

            if (project == null)
            {
                throw new NotFoundException("Project not found.");
            }

            var integration = project.DiscordIntegration;
            if (integration == null)
            {
                integration = new ProjectDiscordIntegration
                {
                    Id = Guid.NewGuid(),
                    ProjectId = projectId,
                    WebhookUrl = dto.WebhookUrl,
                    IsEnabled = dto.IsEnabled,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _integrationRepository.AddAsync(integration);
            }
            else
            {
                integration.WebhookUrl = dto.WebhookUrl;
                integration.IsEnabled = dto.IsEnabled;
                integration.UpdatedAt = DateTime.UtcNow;
                _integrationRepository.Update(integration);
            }

            await _integrationRepository.SaveChangesAsync();
            return Map(integration);
        }

        public async Task<bool> DeleteAsync(Guid projectId, string userId)
        {
            var project = await _projectRepository.Query()
                .Include(currentProject => currentProject.Workspace)
                .ThenInclude(workspace => workspace.Members)
                .Include(currentProject => currentProject.Members)
                .Include(currentProject => currentProject.DiscordIntegration)
                .FirstOrDefaultAsync(currentProject =>
                    currentProject.Id == projectId &&
                    CanManageProject(currentProject, userId));

            if (project?.DiscordIntegration == null)
            {
                return false;
            }

            _integrationRepository.Delete(project.DiscordIntegration);
            await _integrationRepository.SaveChangesAsync();
            return true;
        }

        private static ProjectDiscordIntegrationDto Map(ProjectDiscordIntegration integration)
        {
            return new ProjectDiscordIntegrationDto
            {
                ProjectId = integration.ProjectId,
                WebhookUrl = integration.WebhookUrl,
                IsEnabled = integration.IsEnabled,
                UpdatedAt = integration.UpdatedAt
            };
        }

        private static bool HasProjectAccess(Project project, string userId)
        {
            return IsWorkspaceAdminOrOwner(project.Workspace, userId) ||
                   project.Members.Any(member =>
                       member.UserId == userId &&
                       member.Status == ProjectMemberStatus.Active);
        }

        private static bool CanManageProject(Project project, string userId)
        {
            return IsWorkspaceAdminOrOwner(project.Workspace, userId) ||
                   project.Members.Any(member =>
                       member.UserId == userId &&
                       member.Status == ProjectMemberStatus.Active &&
                       member.Role == ProjectRole.ProjectAdmin);
        }

        private static bool IsWorkspaceAdminOrOwner(Workspace workspace, string userId)
        {
            return workspace.OwnerId == userId ||
                   workspace.Members.Any(member =>
                       member.UserId == userId &&
                       member.Status == WorkspaceMemberStatus.Active &&
                       (member.Role == WorkspaceRole.Owner || member.Role == WorkspaceRole.Admin));
        }
    }
}
