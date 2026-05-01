using TaskFlow.Domain.Common;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities
{
    public class ProjectMember : BaseEntity
    {
        public Guid ProjectId { get; set; }
        public Project Project { get; set; } = null!;

        public string UserId { get; set; } = null!;
        public ApplicationUser User { get; set; } = null!;

        public ProjectRole Role { get; set; }
        public ProjectMemberStatus Status { get; set; } = ProjectMemberStatus.Active;
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
