using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs
{
    public class AddProjectMemberDto
    {
        public string UserId { get; set; } = null!;
        public ProjectRole Role { get; set; }
    }
}
