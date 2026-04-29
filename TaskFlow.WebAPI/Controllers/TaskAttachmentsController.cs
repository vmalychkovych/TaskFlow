using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.WebAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/task-attachments")]
    public class TaskAttachmentsController : ControllerBase
    {
        private readonly ITaskAttachmentService _attachmentService;

        public TaskAttachmentsController(ITaskAttachmentService attachmentService)
        {
            _attachmentService = attachmentService;
        }

        [HttpPost("upload/{taskId}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload(Guid taskId, IFormFile file)
        {
            var result = await _attachmentService.UploadAsync(taskId, file, GetUserId());

            return Ok(result);
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        }
    }
}
