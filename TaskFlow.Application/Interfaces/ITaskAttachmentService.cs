using Microsoft.AspNetCore.Http;
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Interfaces
{
    public interface ITaskAttachmentService
    {
        Task<TaskAttachmentDto> UploadAsync(Guid taskId, IFormFile file, string userId);
    }
}
