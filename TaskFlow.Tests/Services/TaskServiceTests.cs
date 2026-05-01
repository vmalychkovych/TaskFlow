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
        public async Task CreateTaskAsync_ShouldCreateTaskWithAssignee_WhenAssigneeIsActiveProjectMember()
        {
            var userId = "user-1";
            var assigneeUserId = "member-1";
            var projectId = Guid.NewGuid();

            var dto = new CreateTaskDto
            {
                Title = "Test task",
                Description = "Test description",
                ProjectId = projectId,
                AssigneeUserId = assigneeUserId
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
                        },
                        Members =
                        {
                            new ProjectMember
                            {
                                Id = Guid.NewGuid(),
                                UserId = assigneeUserId,
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
                    task.Description == dto.Description &&
                    task.ProjectId == dto.ProjectId &&
                    task.AssigneeUserId == assigneeUserId)),
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
        public async Task CreateTaskAsync_ShouldThrowBadRequest_WhenAssigneeIsNotProjectMember()
        {
            var userId = "owner-1";
            var projectId = Guid.NewGuid();

            var dto = new CreateTaskDto
            {
                Title = "Blocked task",
                Description = "Invalid assignee",
                ProjectId = projectId,
                AssigneeUserId = "workspace-member"
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

            var act = async () => await _taskService.CreateTaskAsync(dto, userId);

            await act.Should()
                .ThrowAsync<BadRequestException>()
                .WithMessage("Assignee must be an active project member.");

            _taskRepositoryMock.Verify(repo => repo.AddAsync(It.IsAny<TaskItem>()), Times.Never);
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
        }

        [Fact]
        public async Task GetTasksAsync_ShouldReturnOnlyTasksAssignedToCurrentUser_WhenAssignedToMeIsTrue()
        {
            var userId = "member-1";
            var projectId = Guid.NewGuid();

            _taskRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<TaskItem>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        Title = "Mine",
                        Description = "Assigned to me",
                        CreatedAt = DateTime.UtcNow,
                        Priority = TaskPriority.Medium,
                        Status = TaskItemStatus.ToDo,
                        ProjectId = projectId,
                        AssigneeUserId = userId,
                        Project = BuildAccessibleProject(projectId, userId)
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        Title = "Not mine",
                        Description = "Assigned to someone else",
                        CreatedAt = DateTime.UtcNow,
                        Priority = TaskPriority.Medium,
                        Status = TaskItemStatus.ToDo,
                        ProjectId = projectId,
                        AssigneeUserId = "other-user",
                        Project = BuildAccessibleProject(projectId, userId)
                    }
                }.AsAsyncQueryable());

            var result = await _taskService.GetTasksAsync(new TaskQuery
            {
                AssignedToMe = true
            }, userId);

            result.Items.Should().ContainSingle(task => task.AssigneeUserId == userId);
        }

        [Fact]
        public async Task UpdateTaskAsync_ShouldClearAssignee_WhenAssigneeUserIdIsNull()
        {
            var userId = "owner-1";
            var projectId = Guid.NewGuid();
            var taskId = Guid.NewGuid();

            var task = new TaskItem
            {
                Id = taskId,
                Title = "Task",
                Description = "Description",
                CreatedAt = DateTime.UtcNow,
                Priority = TaskPriority.Medium,
                Status = TaskItemStatus.ToDo,
                ProjectId = projectId,
                AssigneeUserId = "member-1",
                Project = BuildAccessibleProject(projectId, userId)
            };

            _taskRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<TaskItem> { task }.AsAsyncQueryable());

            var result = await _taskService.UpdateTaskAsync(taskId, new UpdateTaskDto
            {
                Title = "Task updated",
                Description = "Description updated",
                Priority = TaskPriority.High,
                Status = TaskItemStatus.InProgress,
                AssigneeUserId = null
            }, userId);

            result.Should().BeTrue();
            task.AssigneeUserId.Should().BeNull();
        }

        private static Project BuildAccessibleProject(Guid projectId, string memberUserId)
        {
            return new Project
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
                    OwnerId = "owner-1"
                },
                Members =
                {
                    new ProjectMember
                    {
                        Id = Guid.NewGuid(),
                        UserId = memberUserId,
                        Role = ProjectRole.ProjectMember,
                        Status = ProjectMemberStatus.Active
                    }
                }
            };
        }
    }
}
