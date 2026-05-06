using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities
{
    public class ProjectDiscordIntegration : BaseEntity
    {
        public Guid ProjectId { get; set; }
        public Project Project { get; set; } = null!;

        public string WebhookUrl { get; set; } = null!;
        public bool IsEnabled { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
