using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using TaskFlow.Application.Event;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;

public class DiscordNotificationService : IDiscordNotificationService
{
    private readonly HttpClient _httpClient;
    private readonly IGenericRepository<ProjectDiscordIntegration> _integrationRepository;

    public DiscordNotificationService(
        HttpClient httpClient,
        IGenericRepository<ProjectDiscordIntegration> integrationRepository)
    {
        _httpClient = httpClient;
        _integrationRepository = integrationRepository;
    }

    public async Task SendTaskCreatedAsync(TaskCreatedEvent taskCreatedEvent)
    {
        var integration = await GetEnabledIntegrationAsync(taskCreatedEvent.ProjectId);
        if (integration == null)
        {
            return;
        }

        var payload = new
        {
            username = "TaskFlow Bot",
            content = $"New task created: **{taskCreatedEvent.Title}**\nTaskId: `{taskCreatedEvent.TaskId}`"
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        await _httpClient.PostAsync(integration.WebhookUrl, content);
    }

    public async Task SendTaskUpdatedAsync(TaskUpdatedEvent taskUpdatedEvent)
    {
        var integration = await GetEnabledIntegrationAsync(taskUpdatedEvent.ProjectId);
        if (integration == null)
        {
            return;
        }

        var payload = new
        {
            username = "TaskFlow Bot",
            content = $"Task updated: **{taskUpdatedEvent.Title}**\nTaskId: `{taskUpdatedEvent.TaskId}`\nStatus: `{taskUpdatedEvent.Status}`"
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        await _httpClient.PostAsync(integration.WebhookUrl, content);
    }

    private async Task<ProjectDiscordIntegration?> GetEnabledIntegrationAsync(Guid projectId)
    {
        var integration = await _integrationRepository.Query()
            .FirstOrDefaultAsync(currentIntegration =>
                currentIntegration.ProjectId == projectId &&
                currentIntegration.IsEnabled);

        return integration == null || string.IsNullOrWhiteSpace(integration.WebhookUrl)
            ? null
            : integration;
    }
}
