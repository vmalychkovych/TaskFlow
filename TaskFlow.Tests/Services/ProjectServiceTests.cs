using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Exceptions;
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
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly ProjectService _projectService;

        public ProjectServiceTests()
        {
            _projectRepositoryMock = new Mock<IGenericRepository<Project>>();
            _workspaceRepositoryMock = new Mock<IGenericRepository<Workspace>>();
            _userManagerMock = CreateUserManagerMock();

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<MappingProfile>();
            });

            _projectService = new ProjectService(
                _projectRepositoryMock.Object,
                _workspaceRepositoryMock.Object,
                mapperConfig.CreateMapper(),
                _userManagerMock.Object);
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

        [Fact]
        public async Task AddProjectMemberAsync_ShouldAddWorkspaceMemberToProject()
        {
            var project = BuildManagedProject("owner-1", "workspace-user");

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Project> { project }.AsAsyncQueryable());

            _userManagerMock
                .Setup(manager => manager.FindByIdAsync("workspace-user"))
                .ReturnsAsync(new ApplicationUser { Id = "workspace-user", Email = "member@test.com", UserName = "member@test.com", FirstName = "M", LastName = "U" });

            await _projectService.AddProjectMemberAsync(project.Id, new AddProjectMemberDto
            {
                UserId = "workspace-user",
                Role = ProjectRole.ProjectMember
            }, "owner-1");

            project.Members.Should().Contain(member =>
                member.UserId == "workspace-user" &&
                member.Role == ProjectRole.ProjectMember &&
                member.Status == ProjectMemberStatus.Active);
        }

        [Fact]
        public async Task AddProjectMemberAsync_ShouldThrow_WhenUserIsNotWorkspaceMember()
        {
            var project = BuildManagedProject("owner-1");

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Project> { project }.AsAsyncQueryable());

            _userManagerMock
                .Setup(manager => manager.FindByIdAsync("outsider"))
                .ReturnsAsync(new ApplicationUser { Id = "outsider", Email = "out@test.com", UserName = "out@test.com", FirstName = "O", LastName = "U" });

            var act = async () => await _projectService.AddProjectMemberAsync(project.Id, new AddProjectMemberDto
            {
                UserId = "outsider",
                Role = ProjectRole.ProjectMember
            }, "owner-1");

            await act.Should()
                .ThrowAsync<BadRequestException>()
                .WithMessage("User must be an active workspace member.");
        }

        [Fact]
        public async Task RemoveProjectMemberAsync_ShouldMarkMemberAsRemoved()
        {
            var project = BuildManagedProject("owner-1", "member-1", includeProjectMember: true);
            project.Tasks.Add(new TaskItem
            {
                Id = Guid.NewGuid(),
                Title = "Assigned",
                Description = "Assigned task",
                CreatedAt = DateTime.UtcNow,
                Priority = TaskPriority.Medium,
                Status = TaskItemStatus.ToDo,
                ProjectId = project.Id,
                AssigneeUserId = "member-1"
            });

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Project> { project }.AsAsyncQueryable());

            var result = await _projectService.RemoveProjectMemberAsync(project.Id, "member-1", "owner-1");

            result.Should().BeTrue();
            project.Members.Should().Contain(member =>
                member.UserId == "member-1" &&
                member.Status == ProjectMemberStatus.Removed);
            project.Tasks.Should().OnlyContain(task => task.AssigneeUserId == null);
        }

        private static Project BuildManagedProject(string actingUserId, string? workspaceMemberUserId = null, bool includeProjectMember = false)
        {
            var project = new Project
            {
                Id = Guid.NewGuid(),
                Name = "Project",
                Description = "Description",
                WorkspaceId = Guid.NewGuid(),
                Workspace = new Workspace
                {
                    Id = Guid.NewGuid(),
                    Name = "Workspace",
                    Description = "Description",
                    OwnerId = actingUserId
                }
            };

            if (!string.IsNullOrWhiteSpace(workspaceMemberUserId))
            {
                project.Workspace.Members.Add(new WorkspaceMember
                {
                    Id = Guid.NewGuid(),
                    UserId = workspaceMemberUserId,
                    Role = WorkspaceRole.Member,
                    Status = WorkspaceMemberStatus.Active
                });
            }

            if (includeProjectMember && !string.IsNullOrWhiteSpace(workspaceMemberUserId))
            {
                project.Members.Add(new ProjectMember
                {
                    Id = Guid.NewGuid(),
                    UserId = workspaceMemberUserId,
                    Role = ProjectRole.ProjectMember,
                    Status = ProjectMemberStatus.Active,
                    AddedAt = DateTime.UtcNow
                });
            }

            return project;
        }

        private static Mock<UserManager<ApplicationUser>> CreateUserManagerMock()
        {
            var store = new Mock<IUserStore<ApplicationUser>>();
            return new Mock<UserManager<ApplicationUser>>(
                store.Object,
                null!,
                null!,
                null!,
                null!,
                null!,
                null!,
                null!,
                null!);
        }
    }
}
