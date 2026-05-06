namespace TaskFlow.Application.DTOs
{
    public class ConfigureProjectDiscordDto
    {
        public string WebhookUrl { get; set; } = null!;
        public bool IsEnabled { get; set; } = true;
    }
}
