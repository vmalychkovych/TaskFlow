using TaskFlow.Domain.Common;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities
{
    public class WorkspaceMember : BaseEntity
    {
        public Guid WorkspaceId { get; set; }
        public Workspace Workspace { get; set; } = null!;

        public string UserId { get; set; } = null!;
        public ApplicationUser User { get; set; } = null!;

        public WorkspaceRole Role { get; set; }
        public WorkspaceMemberStatus Status { get; set; } = WorkspaceMemberStatus.Active;
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}
