
namespace TaskFlow.Application.DTOs
{
    public class CreateTaskCommentDto
    {
        public string Content { get; set; } = null!;
        public Guid TaskItemId { get; set; }
    }
}
