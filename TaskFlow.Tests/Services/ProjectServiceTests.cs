using AutoMapper;
using FluentAssertions;
using Moq;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Interfaces;
using TaskFlow.Application.Mappings;
using TaskFlow.Application.Services;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Tests.Helpers;

namespace TaskFlow.Tests.Services
{
    public class ProjectServiceTests
    {
        private readonly Mock<IGenericRepository<Project>> _projectRepositoryMock;
        private readonly Mock<IGenericRepository<Workspace>> _workspaceRepositoryMock;
        private readonly ProjectService _projectService;

        public ProjectServiceTests()
        {
            _projectRepositoryMock = new Mock<IGenericRepository<Project>>();
            _workspaceRepositoryMock = new Mock<IGenericRepository<Workspace>>();

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<MappingProfile>();
            });

            _projectService = new ProjectService(
                _projectRepositoryMock.Object,
                _workspaceRepositoryMock.Object,
                mapperConfig.CreateMapper());
        }

        [Fact]
        public async Task CreateProjectAsync_ShouldAddCreatorAsProjectAdmin()
        {
            var userId = "user-1";
            var workspaceId = Guid.NewGuid();
            Project? createdProject = null;

            _workspaceRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Workspace>
                {
                    new()
                    {
                        Id = workspaceId,
                        Name = "Workspace",
                        Description = "Description",
                        OwnerId = userId
                    }
                }.AsAsyncQueryable());

            _projectRepositoryMock
                .Setup(repo => repo.AddAsync(It.IsAny<Project>()))
                .Callback<Project>(project => createdProject = project)
                .Returns(Task.CompletedTask);

            await _projectService.CreateProjectAsync(new CreateProjectDto
            {
                Name = "Project",
                Description = "Description",
                WorkspaceId = workspaceId
            }, userId);

            createdProject.Should().NotBeNull();
            createdProject!.Members.Should().ContainSingle(member =>
                member.UserId == userId &&
                member.Role == ProjectRole.ProjectAdmin &&
                member.Status == ProjectMemberStatus.Active);
        }

        [Fact]
        public async Task GetAllProjectsAsync_ShouldReturnOnlyProjectsWhereUserHasProjectAccess()
        {
            var userId = "member-1";

            var directProject = new Project
            {
                Id = Guid.NewGuid(),
                Name = "Direct",
                Description = "Description",
                WorkspaceId = Guid.NewGuid(),
                Workspace = new Workspace
                {
                    Id = Guid.NewGuid(),
                    Name = "Workspace",
                    Description = "Description",
                    OwnerId = "owner-1"
                },
                Members =
                {
                    new ProjectMember
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Role = ProjectRole.ProjectMember,
                        Status = ProjectMemberStatus.Active
                    }
                }
            };

            var hiddenProject = new Project
            {
                Id = Guid.NewGuid(),
                Name = "Hidden",
                Description = "Description",
                WorkspaceId = Guid.NewGuid(),
                Workspace = new Workspace
                {
                    Id = Guid.NewGuid(),
                    Name = "Workspace",
                    Description = "Description",
                    OwnerId = "owner-2",
                    Members =
                    {
                        new WorkspaceMember
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            Role = WorkspaceRole.Member,
                            Status = WorkspaceMemberStatus.Active
                        }
                    }
                }
            };

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Project> { directProject, hiddenProject }.AsAsyncQueryable());

            var result = await _projectService.GetAllProjectsAsync(userId);

            result.Should().ContainSingle(project => project.Id == directProject.Id);
        }
    }
}
