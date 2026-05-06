namespace TaskFlow.Application.Event
{
    public class TaskUpdatedEvent
    {
        public Guid TaskId { get; set; }
        public Guid ProjectId { get; set; }
        public string Title { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? AssigneeUserId { get; set; }
        public string UserId { get; set; } = null!;
    }
}
