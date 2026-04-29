namespace TaskFlow.Application.DTOs
{
    public class TaskAttachmentDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = null!;
        public string FileUrl { get; set; } = null!;
        public string ContentType { get; set; } = null!;
        public Guid TaskItemId { get; set; }
        public string UploadedById { get; set; } = null!;
        public DateTime UploadedAt { get; set; }
    }
}
