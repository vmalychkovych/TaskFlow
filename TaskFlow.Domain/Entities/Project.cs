using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities
{
    public class Project : BaseEntity
    {
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public Guid WorkspaceId { get; set; }

        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
        public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
        public Workspace Workspace { get; set; } = null!;
    }
}
