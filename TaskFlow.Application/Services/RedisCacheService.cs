using System.Text.Json;
using Microsoft.Extensions.Configuration;
using StackExchange.Redis;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.Application.Services
{
    public class RedisCacheService : ICacheService
    {
        private readonly IDatabase _database;

        public RedisCacheService(IConfiguration configuration)
        {
            var connectionString = configuration["Redis:ConnectionString"];

            var redis = ConnectionMultiplexer.Connect(connectionString!);

            _database = redis.GetDatabase();
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            var value = await _database.StringGetAsync(key);

            if (value.IsNullOrEmpty)
            {
                Console.WriteLine($"CACHE MISS: {key}");
                return default;
            }

            Console.WriteLine($"CACHE HIT: {key}");
            return JsonSerializer.Deserialize<T>(value!);
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan expiration)
        {
            var json = JsonSerializer.Serialize(value);

            await _database.StringSetAsync(key, json, expiration);
        }

        public async Task RemoveAsync(string key)
        {
            await _database.KeyDeleteAsync(key);
        }
    }
}
