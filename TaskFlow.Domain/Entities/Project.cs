using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities
{
    public class Project : BaseEntity
    {
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public Guid WorkspaceId { get; set; }
    }
}
