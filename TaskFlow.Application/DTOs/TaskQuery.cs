
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs
{
    public class TaskQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        public Guid? ProjectId { get; set; }
        public TaskPriority? Priority { get; set; }
        public TaskItemStatus? Status { get; set; }
        public string? AssigneeUserId { get; set; }
        public bool AssignedToMe { get; set; }
        public bool UnassignedOnly { get; set; }

        public string? Search { get; set; }

        public string SortBy { get; set; } = "CreatedAt";
        public string SortOrder { get; set; } = "desc";
    }
}
