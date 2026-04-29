
namespace TaskFlow.Application.DTOs
{
    public class TaskCommentDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = null!;
        public Guid TaskItemId { get; set; }
        public string AuthorId { get; set; } = null!;
        public string AuthorEmail { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }
}
