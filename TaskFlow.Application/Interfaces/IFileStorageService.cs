
using Microsoft.AspNetCore.Http;

namespace TaskFlow.Application.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> UploadFileAsync(IFormFile file);
    }
}
