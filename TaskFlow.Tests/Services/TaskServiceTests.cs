using AutoMapper;
using FluentAssertions;
using Moq;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Event;
using TaskFlow.Application.Exceptions;
using TaskFlow.Application.Interfaces;
using TaskFlow.Application.Mappings;
using TaskFlow.Application.Services;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Tests.Helpers;

namespace TaskFlow.Tests.Services
{
    public class TaskServiceTests
    {
        private readonly Mock<IGenericRepository<TaskItem>> _taskRepositoryMock;
        private readonly Mock<IGenericRepository<Project>> _projectRepositoryMock;
        private readonly Mock<INotificationService> _notificationServiceMock;
        private readonly IMapper _mapper;
        private readonly TaskService _taskService;
        private readonly Mock<IEventBus> _eventBusMock;

        public TaskServiceTests()
        {
            _taskRepositoryMock = new Mock<IGenericRepository<TaskItem>>();
            _projectRepositoryMock = new Mock<IGenericRepository<Project>>();
            _notificationServiceMock = new Mock<INotificationService>();
            _eventBusMock = new Mock<IEventBus>();

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<MappingProfile>();
            });

            _mapper = mapperConfig.CreateMapper();

            _taskService = new TaskService(
                _taskRepositoryMock.Object,
                _projectRepositoryMock.Object,
                _mapper,
                _notificationServiceMock.Object,
                _eventBusMock.Object);
        }

        [Fact]
        public async Task CreateTaskAsync_ShouldCreateTask_WhenUserOwnsWorkspace()
        {
            var userId = "user-1";
            var projectId = Guid.NewGuid();

            var dto = new CreateTaskDto
            {
                Title = "Test task",
                Description = "Test description",
                ProjectId = projectId
            };

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Project>
                {
                    new()
                    {
                        Id = projectId,
                        Name = "Project",
                        Description = "Project description",
                        WorkspaceId = Guid.NewGuid(),
                        Workspace = new Workspace
                        {
                            Id = Guid.NewGuid(),
                            Name = "Workspace",
                            Description = "Workspace description",
                            OwnerId = userId
                        }
                    }
                }.AsAsyncQueryable());

            await _taskService.CreateTaskAsync(dto, userId);

            _taskRepositoryMock.Verify(
                repo => repo.AddAsync(It.Is<TaskItem>(task =>
                    task.Title == dto.Title &&
                    task.Description == dto.Description &&
                    task.ProjectId == dto.ProjectId)),
                Times.Once);

            _taskRepositoryMock.Verify(repo => repo.SaveChangesAsync(), Times.Once);
            _notificationServiceMock.Verify(
                service => service.SendToUserAsync(
                    userId,
                    It.Is<string>(message => message.Contains(dto.Title))),
                Times.Once);
            _eventBusMock.Verify(bus => bus.PublishAsync(It.IsAny<TaskCreatedEvent>()), Times.Once);
        }

        [Fact]
        public async Task CreateTaskAsync_ShouldCreateTask_WhenUserIsActiveProjectMember()
        {
            var userId = "user-2";
            var ownerId = "owner-1";
            var projectId = Guid.NewGuid();

            var dto = new CreateTaskDto
            {
                Title = "Member task",
                Description = "Task by project member",
                ProjectId = projectId
            };

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Project>
                {
                    new()
                    {
                        Id = projectId,
                        Name = "Project",
                        Description = "Project description",
                        WorkspaceId = Guid.NewGuid(),
                        Workspace = new Workspace
                        {
                            Id = Guid.NewGuid(),
                            Name = "Workspace",
                            Description = "Workspace description",
                            OwnerId = ownerId
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
                    }
                }.AsAsyncQueryable());

            await _taskService.CreateTaskAsync(dto, userId);

            _taskRepositoryMock.Verify(
                repo => repo.AddAsync(It.Is<TaskItem>(task =>
                    task.Title == dto.Title &&
                    task.ProjectId == dto.ProjectId)),
                Times.Once);
        }

        [Fact]
        public async Task CreateTaskAsync_ShouldCreateTask_WhenUserIsWorkspaceAdmin()
        {
            var userId = "admin-1";
            var ownerId = "owner-1";
            var projectId = Guid.NewGuid();

            var dto = new CreateTaskDto
            {
                Title = "Admin task",
                Description = "Task by workspace admin",
                ProjectId = projectId
            };

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Project>
                {
                    new()
                    {
                        Id = projectId,
                        Name = "Project",
                        Description = "Project description",
                        WorkspaceId = Guid.NewGuid(),
                        Workspace = new Workspace
                        {
                            Id = Guid.NewGuid(),
                            Name = "Workspace",
                            Description = "Workspace description",
                            OwnerId = ownerId,
                            Members =
                            {
                                new WorkspaceMember
                                {
                                    Id = Guid.NewGuid(),
                                    UserId = userId,
                                    Role = WorkspaceRole.Admin,
                                    Status = WorkspaceMemberStatus.Active
                                }
                            }
                        }
                    }
                }.AsAsyncQueryable());

            await _taskService.CreateTaskAsync(dto, userId);

            _taskRepositoryMock.Verify(
                repo => repo.AddAsync(It.Is<TaskItem>(task => task.ProjectId == dto.ProjectId)),
                Times.Once);
        }

        [Fact]
        public async Task CreateTaskAsync_ShouldThrowNotFound_WhenUserIsOnlyWorkspaceMember()
        {
            var userId = "user-2";
            var projectId = Guid.NewGuid();

            var dto = new CreateTaskDto
            {
                Title = "Blocked task",
                Description = "Task by workspace-only member",
                ProjectId = projectId
            };

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Project>
                {
                    new()
                    {
                        Id = projectId,
                        Name = "Project",
                        Description = "Project description",
                        WorkspaceId = Guid.NewGuid(),
                        Workspace = new Workspace
                        {
                            Id = Guid.NewGuid(),
                            Name = "Workspace",
                            Description = "Workspace description",
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
                        }
                    }
                }.AsAsyncQueryable());

            var act = async () => await _taskService.CreateTaskAsync(dto, userId);

            await act.Should()
                .ThrowAsync<NotFoundException>()
                .WithMessage("Project not found.");

            _taskRepositoryMock.Verify(repo => repo.AddAsync(It.IsAny<TaskItem>()), Times.Never);
            _taskRepositoryMock.Verify(repo => repo.SaveChangesAsync(), Times.Never);
        }
    }
}
