using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs
{
    public class AddWorkspaceMemberDto
    {
        public string UserId { get; set; } = null!;
        public WorkspaceRole Role { get; set; }
    }
}
