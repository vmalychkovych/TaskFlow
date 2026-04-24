using TaskFlow.Application.DTOs;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Services
{
    public class ProjectService : IProjectService
    {
        private readonly IGenericRepository<Project> _projectRepository;

        public ProjectService(IGenericRepository<Project> projectRepository)
        {
            _projectRepository = projectRepository;
        }

        public async Task CreateProjectAsync(CreateProjectDto dto)
        {
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

        public async Task<List<ProjectDto>> GetAllProjectsAsync()
        {
            var project = await _projectRepository.GetAllAsync();

            var result = project
                .Select(project => new ProjectDto
                {
                    Id = project.Id,
                    Name = project.Name,
                    Description = project.Description,
                    WorkspaceId = project.WorkspaceId
                })
                .ToList();

            return result;
        }

        public async Task<ProjectDto?> GetProjectByIdAsync(Guid id)
        {
            var project = await _projectRepository.GetByIdAsync(id);

            if (project == null)
            {
                return null;
            }

            return new ProjectDto
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                WorkspaceId = project.WorkspaceId
            };
        }

        public async Task<bool> UpdateProjectAsync(Guid id, UpdateProjectDto dto)
        {
            var project = await _projectRepository.GetByIdAsync(id);

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

        public async Task<bool> DeleteProjectAsync(Guid id)
        {
            var project = await _projectRepository.GetByIdAsync(id);

            if (project == null)
            {
                return false;
            }

            _projectRepository.Delete(project);
            await _projectRepository.SaveChangesAsync();

            return true;
        }
    }
}
