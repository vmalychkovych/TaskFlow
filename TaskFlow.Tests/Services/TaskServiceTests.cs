using AutoMapper;
using FluentAssertions;
using Moq;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Exceptions;
using TaskFlow.Application.Interfaces;
using TaskFlow.Application.Mappings;
using TaskFlow.Application.Services;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Tests.Services
{
    public class TaskServiceTests
    {
        private readonly Mock<IGenericRepository<TaskItem>> _taskRepositoryMock;
        private readonly Mock<IGenericRepository<Project>> _projectRepositoryMock;
        private readonly Mock<INotificationService> _notificationServiceMock;
        private readonly IMapper _mapper;
        private readonly TaskService _taskService;

        public TaskServiceTests()
        {
            _taskRepositoryMock = new Mock<IGenericRepository<TaskItem>>();
            _projectRepositoryMock = new Mock<IGenericRepository<Project>>();
            _notificationServiceMock = new Mock<INotificationService>();

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<MappingProfile>();
            });

            _mapper = mapperConfig.CreateMapper();

            _taskService = new TaskService(
                _taskRepositoryMock.Object,
                _projectRepositoryMock.Object,
                _mapper,
                _notificationServiceMock.Object);
        }

        [Fact]
        public async Task CreateTaskAsync_ShouldCreateTask_WhenProjectExists()
        {
            // Arrange
            var userId = "user-1";
            var projectId = Guid.NewGuid();

            var dto = new CreateTaskDto
            {
                Title = "Test task",
                Description = "Test description",
                ProjectId = projectId
            };

            var projects = new List<Project>
            {
                new Project
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
            }.AsQueryable();

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(projects);

            // Act
            await _taskService.CreateTaskAsync(dto, userId);

            // Assert
            _taskRepositoryMock.Verify(
                repo => repo.AddAsync(It.Is<TaskItem>(task =>
                    task.Title == dto.Title &&
                    task.Description == dto.Description &&
                    task.ProjectId == dto.ProjectId &&
                    task.ProjectId == projectId)),
                Times.Once);

            _taskRepositoryMock.Verify(
                repo => repo.SaveChangesAsync(),
                Times.Once);

            _notificationServiceMock.Verify(
                service => service.SendToUserAsync(
                    userId,
                    It.Is<string>(message => message.Contains(dto.Title))),
                Times.Once);
        }

        [Fact]
        public async Task CreateTaskAsync_ShouldThrowNotFound_WhenProjectDoesNotBelongToUser()
        {
            // Arrange
            var userId = "user-1";
            var anotherUserId = "user-2";
            var projectId = Guid.NewGuid();

            var dto = new CreateTaskDto
            {
                Title = "Test task",
                Description = "Test description",
                ProjectId = projectId
            };

            var projects = new List<Project>
            {
                new Project
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
                        OwnerId = anotherUserId
                    }
                }
            }.AsQueryable();

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(projects);

            // Act
            var act = async () => await _taskService.CreateTaskAsync(dto, userId);

            // Assert
            await act.Should()
                .ThrowAsync<NotFoundException>()
                .WithMessage("Project not found.");

            _taskRepositoryMock.Verify(
                repo => repo.AddAsync(It.IsAny<TaskItem>()),
                Times.Never);

            _taskRepositoryMock.Verify(
                repo => repo.SaveChangesAsync(),
                Times.Never);

            _notificationServiceMock.Verify(
                service => service.SendToUserAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>()),
                Times.Never);
        }
    }
}