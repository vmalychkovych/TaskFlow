
using TaskFlow.Domain.Common;

namespace TaskFlow.Domain.Entities
{
    public class TaskAttachment : BaseEntity
    {
        public string FileName { get; set; } = null!;
        public string FileUrl { get; set; } = null!;
        public string ContentType { get; set; } = null!;

        public Guid TaskItemId { get; set; }
        public TaskItem TaskItem { get; set; } = null!;

        public string UploadedById { get; set; } = null!;
        public ApplicationUser UploadedBy { get; set; } = null!;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
