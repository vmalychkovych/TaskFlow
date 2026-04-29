using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.Application.Services
{
    public class MinioFileStorageService : IFileStorageService
    {
        private readonly IMinioClient _minioClient;
        private readonly string _bucketName;
        private readonly string _endpoint;

        public MinioFileStorageService(IConfiguration configuration)
        {
            _endpoint = configuration["Minio:Endpoint"]!;
            _bucketName = configuration["Minio:BucketName"]!;

            _minioClient = new MinioClient()
                .WithEndpoint(_endpoint)
                .WithCredentials(
                    configuration["Minio:AccessKey"],
                    configuration["Minio:SecretKey"])
                .WithSSL(bool.Parse(configuration["Minio:UseSSL"]!))
                .Build();
        }

        public async Task<string> UploadFileAsync(IFormFile file)
        {
            var bucketExists = await _minioClient.BucketExistsAsync(
                new BucketExistsArgs().WithBucket(_bucketName));

            if (!bucketExists)
            {
                await _minioClient.MakeBucketAsync(
                    new MakeBucketArgs().WithBucket(_bucketName));
            }

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";

            await using var stream = file.OpenReadStream();

            await _minioClient.PutObjectAsync(
                new PutObjectArgs()
                    .WithBucket(_bucketName)
                    .WithObject(fileName)
                    .WithStreamData(stream)
                    .WithObjectSize(file.Length)
                    .WithContentType(file.ContentType));

            return $"http://localhost:9000/{_bucketName}/{fileName}";
        }
    }
}
