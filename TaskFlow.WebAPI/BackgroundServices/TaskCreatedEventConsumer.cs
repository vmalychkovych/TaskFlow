using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using TaskFlow.Application.Event;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.WebAPI.BackgroundServices
{
    public class TaskCreatedEventConsumer : BackgroundService
    {
        private readonly ILogger<TaskCreatedEventConsumer> _logger;
        private IConnection? _connection;
        private IModel? _channel;
        private readonly IServiceScopeFactory _scopeFactory;

        public TaskCreatedEventConsumer(ILogger<TaskCreatedEventConsumer> logger, IServiceScopeFactory scopeFactory)
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
                queue: nameof(TaskCreatedEvent),
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null);

            var consumer = new EventingBasicConsumer(_channel);

            consumer.Received += async (sender, args) =>
            {
                try
                {
                    var body = args.Body.ToArray();
                    var json = Encoding.UTF8.GetString(body);

                    var taskCreatedEvent = JsonSerializer.Deserialize<TaskCreatedEvent>(json);

                    if (taskCreatedEvent == null)
                    {
                        _logger.LogWarning("Received invalid TaskCreatedEvent message");
                        _channel.BasicAck(args.DeliveryTag, multiple: false);
                        return;
                    }

                    _logger.LogInformation(
                        "Task created event consumed. TaskId: {TaskId}, Title: {Title}, UserId: {UserId}",
                        taskCreatedEvent.TaskId,
                        taskCreatedEvent.Title,
                        taskCreatedEvent.UserId);

                    using var scope = _scopeFactory.CreateScope();

                    var discordService = scope.ServiceProvider
                        .GetRequiredService<IDiscordNotificationService>();

                    await discordService.SendTaskCreatedAsync(taskCreatedEvent);

                    _channel.BasicAck(args.DeliveryTag, multiple: false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while consuming TaskCreatedEvent");

                    _channel.BasicNack(
                        deliveryTag: args.DeliveryTag,
                        multiple: false,
                        requeue: true);
                }
            };

            _channel.BasicConsume(
                queue: nameof(TaskCreatedEvent),
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