using System.Net;
using System.Text.Json;
using TaskFlow.Application.Exceptions;

namespace TaskFlow.WebAPI.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionMiddleware(
            RequestDelegate next,
            ILogger<ExceptionMiddleware> logger,
            IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ex.Message);

                context.Response.ContentType = "application/json";

                context.Response.StatusCode = ex switch
                {
                    NotFoundException => (int)HttpStatusCode.NotFound,
                    BadRequestException => (int)HttpStatusCode.BadRequest,
                    _ => (int)HttpStatusCode.InternalServerError
                };

                var response = new
                {
                    message = ex.Message,
                    details = _env.IsDevelopment() && context.Response.StatusCode == 500
                         ? ex.StackTrace
                            : null
                };

                var json = JsonSerializer.Serialize(response);

                await context.Response.WriteAsync(json);
            }
        }
    }
}
