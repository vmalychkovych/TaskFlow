
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs
{
    public class UpdateTaskDto
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public TaskPriority Priority { get; set; }
        public TaskItemStatus Status { get; set; }
        public string? AssigneeUserId { get; set; }
    }
}
