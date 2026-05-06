using FluentAssertions;
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
    public class ProjectDiscordIntegrationServiceTests
    {
        private readonly Mock<IGenericRepository<Project>> _projectRepositoryMock;
        private readonly Mock<IGenericRepository<ProjectDiscordIntegration>> _integrationRepositoryMock;
        private readonly ProjectDiscordIntegrationService _service;

        public ProjectDiscordIntegrationServiceTests()
        {
            _projectRepositoryMock = new Mock<IGenericRepository<Project>>();
            _integrationRepositoryMock = new Mock<IGenericRepository<ProjectDiscordIntegration>>();
            _service = new ProjectDiscordIntegrationService(_projectRepositoryMock.Object, _integrationRepositoryMock.Object);
        }

        [Fact]
        public async Task UpsertAsync_ShouldCreateIntegration_WhenManagerHasAccess()
        {
            var project = BuildManagedProject("owner-1");

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Project> { project }.AsAsyncQueryable());

            var result = await _service.UpsertAsync(project.Id, new ConfigureProjectDiscordDto
            {
                WebhookUrl = "https://discord.com/api/webhooks/1/abc",
                IsEnabled = true
            }, "owner-1");

            result.ProjectId.Should().Be(project.Id);
            result.WebhookUrl.Should().Be("https://discord.com/api/webhooks/1/abc");

            _integrationRepositoryMock.Verify(repo => repo.AddAsync(It.Is<ProjectDiscordIntegration>(integration =>
                integration.ProjectId == project.Id &&
                integration.WebhookUrl == "https://discord.com/api/webhooks/1/abc" &&
                integration.IsEnabled)), Times.Once);
            _integrationRepositoryMock.Verify(repo => repo.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UpsertAsync_ShouldThrow_WhenUserCannotManageProject()
        {
            var project = BuildManagedProject("owner-1");

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Project> { project }.AsAsyncQueryable());

            var act = async () => await _service.UpsertAsync(project.Id, new ConfigureProjectDiscordDto
            {
                WebhookUrl = "https://discord.com/api/webhooks/1/abc",
                IsEnabled = true
            }, "outsider");

            await act.Should()
                .ThrowAsync<NotFoundException>()
                .WithMessage("Project not found.");
        }

        [Fact]
        public async Task DeleteAsync_ShouldRemoveExistingIntegration()
        {
            var project = BuildManagedProject("owner-1");
            project.DiscordIntegration = new ProjectDiscordIntegration
            {
                Id = Guid.NewGuid(),
                ProjectId = project.Id,
                WebhookUrl = "https://discord.com/api/webhooks/1/abc",
                IsEnabled = true
            };

            _projectRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<Project> { project }.AsAsyncQueryable());

            var result = await _service.DeleteAsync(project.Id, "owner-1");

            result.Should().BeTrue();
            _integrationRepositoryMock.Verify(repo => repo.Delete(project.DiscordIntegration), Times.Once);
        }

        private static Project BuildManagedProject(string ownerUserId)
        {
            return new Project
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
                    OwnerId = ownerUserId
                }
            };
        }
    }
}
