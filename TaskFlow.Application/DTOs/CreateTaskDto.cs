
namespace TaskFlow.Application.DTOs
{
    public class CreateTaskDto
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public Guid ProjectId { get; set; }
    }
}
