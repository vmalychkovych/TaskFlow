using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Exceptions;
using TaskFlow.Application.Interfaces;
using TaskFlow.Application.Services;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Tests.Helpers;

namespace TaskFlow.Tests.Services
{
    public class WorkspaceServiceTests
    {
        private readonly Mock<IGenericRepository<Workspace>> _workspaceRepositoryMock;
        private readonly Mock<ICacheService> _cacheServiceMock;
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly WorkspaceService _workspaceService;

        public WorkspaceServiceTests()
        {
            _workspaceRepositoryMock = new Mock<IGenericRepository<Workspace>>();
            _cacheServiceMock = new Mock<ICacheService>();
            _userManagerMock = CreateUserManagerMock();
            _workspaceService = new WorkspaceService(
                _workspaceRepositoryMock.Object,
                _cacheServiceMock.Object,
                _userManagerMock.Object);
        }

        [Fact]
        public async Task CreateWorkspaceAsync_ShouldAddOwnerAsActiveWorkspaceMember()
        {
            var dto = new CreateWorkspaceDto
            {
                Name = "Workspace",
                Description = "Description"
            };

            Workspace? createdWorkspace = null;

            _workspaceRepositoryMock
                .Setup(repo => repo.AddAsync(It.IsAny<Workspace>()))
                .Callback<Workspace>(workspace => createdWorkspace = workspace)
                .Returns(Task.CompletedTask);

            await _workspaceService.CreateWorkspaceAsync(dto, "user-1");

            createdWorkspace.Should().NotBeNull();
            createdWorkspace!.OwnerId.Should().Be("user-1");
            createdWorkspace.Members.Should().ContainSingle(member =>
                member.UserId == "user-1" &&
                member.Role == WorkspaceRole.Owner &&
                member.Status == WorkspaceMemberStatus.Active);
        }

        [Fact]
        public async Task GetAllWorkspacesAsync_ShouldReturnWorkspacesForActiveMember()
        {
            var userId = "user-2";
            var accessibleWorkspace = new Workspace
            {
                Id = Guid.NewGuid(),
                Name = "Accessible",
                Description = "Workspace",
                OwnerId = "owner-1",
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
            };

            var hiddenWorkspace = new Workspace
            {
                Id = Guid.NewGuid(),
                Name = "Hidden",
                Description = "Workspace",
                OwnerId = "owner-3"
            };

            _workspaceRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Workspace> { accessibleWorkspace, hiddenWorkspace }.AsAsyncQueryable());

            var result = await _workspaceService.GetAllWorkspacesAsync(userId);

            result.Should().ContainSingle(workspace => workspace.Id == accessibleWorkspace.Id);
        }

        [Fact]
        public async Task AddWorkspaceMemberAsync_ShouldAddActiveWorkspaceMember()
        {
            var workspace = BuildManagedWorkspace("owner-1");

            _workspaceRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Workspace> { workspace }.AsAsyncQueryable());

            _userManagerMock
                .Setup(manager => manager.FindByIdAsync("member-1"))
                .ReturnsAsync(new ApplicationUser
                {
                    Id = "member-1",
                    Email = "member@test.com",
                    UserName = "member@test.com",
                    FirstName = "Member",
                    LastName = "One"
                });

            await _workspaceService.AddWorkspaceMemberAsync(workspace.Id, new AddWorkspaceMemberDto
            {
                UserId = "member-1",
                Role = WorkspaceRole.Member
            }, "owner-1");

            workspace.Members.Should().Contain(member =>
                member.UserId == "member-1" &&
                member.Role == WorkspaceRole.Member &&
                member.Status == WorkspaceMemberStatus.Active);
        }

        [Fact]
        public async Task AddWorkspaceMemberAsync_ShouldThrow_WhenUserAlreadyActiveMember()
        {
            var workspace = BuildManagedWorkspace("owner-1");
            workspace.Members.Add(new WorkspaceMember
            {
                Id = Guid.NewGuid(),
                WorkspaceId = workspace.Id,
                UserId = "member-1",
                Role = WorkspaceRole.Member,
                Status = WorkspaceMemberStatus.Active
            });

            _workspaceRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Workspace> { workspace }.AsAsyncQueryable());

            _userManagerMock
                .Setup(manager => manager.FindByIdAsync("member-1"))
                .ReturnsAsync(new ApplicationUser
                {
                    Id = "member-1",
                    Email = "member@test.com",
                    UserName = "member@test.com",
                    FirstName = "Member",
                    LastName = "One"
                });

            var act = async () => await _workspaceService.AddWorkspaceMemberAsync(workspace.Id, new AddWorkspaceMemberDto
            {
                UserId = "member-1",
                Role = WorkspaceRole.Member
            }, "owner-1");

            await act.Should()
                .ThrowAsync<BadRequestException>()
                .WithMessage("User is already an active workspace member.");
        }

        [Fact]
        public async Task RemoveWorkspaceMemberAsync_ShouldRemoveWorkspaceMember_ProjectMemberships_AndAssignee()
        {
            var workspace = BuildManagedWorkspace("owner-1");
            workspace.Members.Add(new WorkspaceMember
            {
                Id = Guid.NewGuid(),
                WorkspaceId = workspace.Id,
                UserId = "member-1",
                Role = WorkspaceRole.Member,
                Status = WorkspaceMemberStatus.Active
            });

            workspace.Projects.Add(new Project
            {
                Id = Guid.NewGuid(),
                Name = "Project",
                Description = "Description",
                WorkspaceId = workspace.Id,
                Members =
                {
                    new ProjectMember
                    {
                        Id = Guid.NewGuid(),
                        UserId = "member-1",
                        Role = ProjectRole.ProjectMember,
                        Status = ProjectMemberStatus.Active,
                        AddedAt = DateTime.UtcNow
                    }
                },
                Tasks =
                {
                    new TaskItem
                    {
                        Id = Guid.NewGuid(),
                        Title = "Assigned",
                        Description = "Description",
                        CreatedAt = DateTime.UtcNow,
                        Priority = TaskPriority.Medium,
                        Status = TaskItemStatus.ToDo,
                        ProjectId = Guid.NewGuid(),
                        AssigneeUserId = "member-1"
                    }
                }
            });

            _workspaceRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Workspace> { workspace }.AsAsyncQueryable());

            var result = await _workspaceService.RemoveWorkspaceMemberAsync(workspace.Id, "member-1", "owner-1");

            result.Should().BeTrue();
            workspace.Members.Should().Contain(member =>
                member.UserId == "member-1" &&
                member.Status == WorkspaceMemberStatus.Removed);
            workspace.Projects.SelectMany(project => project.Members)
                .Should().OnlyContain(member => member.Status == ProjectMemberStatus.Removed);
            workspace.Projects.SelectMany(project => project.Tasks)
                .Should().OnlyContain(task => task.AssigneeUserId == null);
        }

        private static Workspace BuildManagedWorkspace(string ownerUserId)
        {
            return new Workspace
            {
                Id = Guid.NewGuid(),
                Name = "Workspace",
                Description = "Description",
                OwnerId = ownerUserId
            };
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
