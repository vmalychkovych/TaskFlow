using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using TaskFlow.Application.Event;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.WebAPI.BackgroundServices
{
    public class TaskUpdatedEventConsumer : BackgroundService
    {
        private readonly ILogger<TaskUpdatedEventConsumer> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private IConnection? _connection;
        private IModel? _channel;

        public TaskUpdatedEventConsumer(ILogger<TaskUpdatedEventConsumer> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var factory = new ConnectionFactory
            {
                HostName = "localhost",
                UserName = "guest",
                Password = "guest"
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();

            _channel.QueueDeclare(
                queue: nameof(TaskUpdatedEvent),
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null);

            var consumer = new EventingBasicConsumer(_channel);

            consumer.Received += async (_, args) =>
            {
                try
                {
                    var body = args.Body.ToArray();
                    var json = Encoding.UTF8.GetString(body);
                    var taskUpdatedEvent = JsonSerializer.Deserialize<TaskUpdatedEvent>(json);

                    if (taskUpdatedEvent == null)
                    {
                        _logger.LogWarning("Received invalid TaskUpdatedEvent message");
                        _channel.BasicAck(args.DeliveryTag, multiple: false);
                        return;
                    }

                    _logger.LogInformation(
                        "Task updated event consumed. TaskId: {TaskId}, ProjectId: {ProjectId}, Status: {Status}, UserId: {UserId}",
                        taskUpdatedEvent.TaskId,
                        taskUpdatedEvent.ProjectId,
                        taskUpdatedEvent.Status,
                        taskUpdatedEvent.UserId);

                    using var scope = _scopeFactory.CreateScope();
                    var discordService = scope.ServiceProvider.GetRequiredService<IDiscordNotificationService>();
                    await discordService.SendTaskUpdatedAsync(taskUpdatedEvent);

                    _channel.BasicAck(args.DeliveryTag, multiple: false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while consuming TaskUpdatedEvent");
                    _channel.BasicNack(args.DeliveryTag, multiple: false, requeue: true);
                }
            };

            _channel.BasicConsume(
                queue: nameof(TaskUpdatedEvent),
                autoAck: false,
                consumer: consumer);

            return Task.CompletedTask;
        }

        public override void Dispose()
        {
            _channel?.Dispose();
            _connection?.Dispose();
            base.Dispose();
        }
    }
}
