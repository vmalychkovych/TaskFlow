namespace TaskFlow.Application.DTOs
{
    public class ProjectDiscordIntegrationDto
    {
        public Guid ProjectId { get; set; }
        public string ProjectName { get; set; } = null!;
        public string WebhookUrl { get; set; } = null!;
        public bool IsEnabled { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
