using FluentAssertions;
using Moq;
using System.Net;
using System.Text;
using TaskFlow.Application.Event;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;
using TaskFlow.Tests.Helpers;

namespace TaskFlow.Tests.Services
{
    public class DiscordNotificationServiceTests
    {
        [Fact]
        public async Task SendTaskCreatedAsync_ShouldPostToProjectWebhook_WhenIntegrationExists()
        {
            var handler = new RecordingHttpMessageHandler();
            var httpClient = new HttpClient(handler);
            var integrationRepositoryMock = new Mock<IGenericRepository<ProjectDiscordIntegration>>();

            var projectId = Guid.NewGuid();

            integrationRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<ProjectDiscordIntegration>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        ProjectId = projectId,
                        WebhookUrl = "https://discord.com/api/webhooks/1/abc",
                        IsEnabled = true
                    }
                }.AsAsyncQueryable());

            IDiscordNotificationService service = new DiscordNotificationService(httpClient, integrationRepositoryMock.Object);

            await service.SendTaskCreatedAsync(new TaskCreatedEvent
            {
                TaskId = Guid.NewGuid(),
                ProjectId = projectId,
                Title = "New task",
                UserId = "user-1"
            });

            handler.Requests.Should().ContainSingle();
            handler.Requests[0].RequestUri!.ToString().Should().Be("https://discord.com/api/webhooks/1/abc");
            var body = await handler.Requests[0].Content!.ReadAsStringAsync();
            body.Should().Contain("New task");
        }

        [Fact]
        public async Task SendTaskUpdatedAsync_ShouldPostToProjectWebhook_WhenIntegrationExists()
        {
            var handler = new RecordingHttpMessageHandler();
            var httpClient = new HttpClient(handler);
            var integrationRepositoryMock = new Mock<IGenericRepository<ProjectDiscordIntegration>>();

            var projectId = Guid.NewGuid();

            integrationRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<ProjectDiscordIntegration>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        ProjectId = projectId,
                        WebhookUrl = "https://discord.com/api/webhooks/1/abc",
                        IsEnabled = true
                    }
                }.AsAsyncQueryable());

            IDiscordNotificationService service = new DiscordNotificationService(httpClient, integrationRepositoryMock.Object);

            await service.SendTaskUpdatedAsync(new TaskUpdatedEvent
            {
                TaskId = Guid.NewGuid(),
                ProjectId = projectId,
                Title = "Updated task",
                Status = "Done",
                AssigneeUserId = "user-1",
                UserId = "user-2"
            });

            handler.Requests.Should().ContainSingle();
            var body = await handler.Requests[0].Content!.ReadAsStringAsync();
            body.Should().Contain("Task updated");
            body.Should().Contain("Done");
        }

        [Fact]
        public async Task SendTaskCreatedAsync_ShouldDoNothing_WhenIntegrationDoesNotExist()
        {
            var handler = new RecordingHttpMessageHandler();
            var httpClient = new HttpClient(handler);
            var integrationRepositoryMock = new Mock<IGenericRepository<ProjectDiscordIntegration>>();

            integrationRepositoryMock
                .Setup(repo => repo.Query())
                .Returns(new List<ProjectDiscordIntegration>().AsAsyncQueryable());

            IDiscordNotificationService service = new DiscordNotificationService(httpClient, integrationRepositoryMock.Object);

            await service.SendTaskCreatedAsync(new TaskCreatedEvent
            {
                TaskId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                Title = "New task",
                UserId = "user-1"
            });

            handler.Requests.Should().BeEmpty();
        }

        private sealed class RecordingHttpMessageHandler : HttpMessageHandler
        {
            public List<HttpRequestMessage> Requests { get; } = new();

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                Requests.Add(CloneRequest(request));
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NoContent));
            }

            private static HttpRequestMessage CloneRequest(HttpRequestMessage request)
            {
                var clone = new HttpRequestMessage(request.Method, request.RequestUri);
                if (request.Content != null)
                {
                    var content = request.Content.ReadAsStringAsync().GetAwaiter().GetResult();
                    clone.Content = new StringContent(content, Encoding.UTF8, request.Content.Headers.ContentType?.MediaType ?? "application/json");
                }

                return clone;
            }
        }
    }
}
