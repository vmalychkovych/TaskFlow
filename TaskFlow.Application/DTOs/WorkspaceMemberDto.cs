namespace TaskFlow.Application.DTOs
{
    public class WorkspaceMemberDto
    {
        public string UserId { get; set; } = null!;
        public string Role { get; set; } = null!;
        public string Status { get; set; } = null!;
        public DateTime JoinedAt { get; set; }
    }
}
