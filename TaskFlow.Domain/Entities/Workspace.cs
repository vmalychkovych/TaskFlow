using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities
{
    public class Workspace : BaseEntity
    {
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;

        public ICollection<Project> Projects { get; set; } = new List<Project>();

        public string OwnerId { get; set; } = null!;
        public ApplicationUser Owner { get; set; } = null!;
    }
}
