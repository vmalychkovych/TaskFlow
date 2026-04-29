using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Exceptions;
using TaskFlow.Application.Interfaces;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Services
{
    public class TaskAttachmentService : ITaskAttachmentService
    {
        private readonly IGenericRepository<TaskAttachment> _attachmentRepository;
        private readonly IGenericRepository<TaskItem> _taskRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<TaskAttachmentService> _logger;

        public TaskAttachmentService(
            IGenericRepository<TaskAttachment> attachmentRepository,
            IGenericRepository<TaskItem> taskRepository,
            IFileStorageService fileStorageService,
            ILogger<TaskAttachmentService> logger)
        {
            _attachmentRepository = attachmentRepository;
            _taskRepository = taskRepository;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        public async Task<TaskAttachmentDto> UploadAsync(Guid taskId, IFormFile file, string userId)
        {
            if (file == null)
            {
                throw new BadRequestException("File is required.");
            }

            if (file.Length == 0)
            {
                throw new BadRequestException("File is empty.");
            }

            _logger.LogInformation(
                "Starting attachment upload. TaskId: {TaskId}, UserId: {UserId}, FileName: {FileName}, Size: {FileSize}",
                taskId,
                userId,
                file.FileName,
                file.Length);

            var taskExists = await _taskRepository.Query()
                .Include(task => task.Project)
                .ThenInclude(project => project.Workspace)
                .AnyAsync(task =>
                    task.Id == taskId &&
                    task.Project.Workspace.OwnerId == userId);

            if (!taskExists)
            {
                throw new NotFoundException("Task not found.");
            }

            _logger.LogInformation("Task ownership check passed for attachment upload. TaskId: {TaskId}", taskId);

            var fileUrl = await _fileStorageService.UploadFileAsync(file);

            _logger.LogInformation("File uploaded to storage. TaskId: {TaskId}, FileUrl: {FileUrl}", taskId, fileUrl);

            var attachment = new TaskAttachment
            {
                Id = Guid.NewGuid(),
                FileName = file.FileName,
                FileUrl = fileUrl,
                ContentType = file.ContentType,
                TaskItemId = taskId,
                UploadedById = userId,
                UploadedAt = DateTime.UtcNow
            };

            await _attachmentRepository.AddAsync(attachment);
            await _attachmentRepository.SaveChangesAsync();

            _logger.LogInformation("Attachment metadata saved. AttachmentId: {AttachmentId}", attachment.Id);

            return new TaskAttachmentDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                FileUrl = attachment.FileUrl,
                ContentType = attachment.ContentType,
                TaskItemId = attachment.TaskItemId,
                UploadedById = attachment.UploadedById,
                UploadedAt = attachment.UploadedAt
            };
        }
    }
}
