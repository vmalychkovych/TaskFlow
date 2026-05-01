using FluentAssertions;
using Moq;
using TaskFlow.Application.DTOs;
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
        private readonly WorkspaceService _workspaceService;

        public WorkspaceServiceTests()
        {
            _workspaceRepositoryMock = new Mock<IGenericRepository<Workspace>>();
            _cacheServiceMock = new Mock<ICacheService>();
            _workspaceService = new WorkspaceService(_workspaceRepositoryMock.Object, _cacheServiceMock.Object);
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
    }
}
