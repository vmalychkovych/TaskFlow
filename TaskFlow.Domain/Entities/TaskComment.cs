
using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities
{
    public class TaskComment : BaseEntity
    {
        public string Content { get; set; } = null!;

        public Guid TaskItemId { get; set; }
        public TaskItem TaskItem { get; set; } = null!;

        public string AuthorId { get; set; } = null!;
        public ApplicationUser Author { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
