namespace TaskFlow.Application.DTOs
{
    public class ProjectDetailsDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public Guid WorkspaceId { get; set; }

        public List<TaskDto> Tasks { get; set; } = new();
    }
}
