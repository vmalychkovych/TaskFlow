using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;
using TaskFlow.Application.Event;
using TaskFlow.Application.Interfaces;

public class DiscordNotificationService : IDiscordNotificationService
{
    private readonly HttpClient _httpClient;
    private readonly string _webhookUrl;

    public DiscordNotificationService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _webhookUrl = configuration["Discord:WebhookUrl"]!;
    }

    public async Task SendTaskCreatedAsync(TaskCreatedEvent taskCreatedEvent)
    {
        if (string.IsNullOrWhiteSpace(_webhookUrl))
        {
            return;
        }

        var payload = new
        {
            username = "TaskFlow Bot",
            content = $"🆕 New task created: **{taskCreatedEvent.Title}**\nTaskId: `{taskCreatedEvent.TaskId}`"
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        await _httpClient.PostAsync(_webhookUrl, content);
    }
}
