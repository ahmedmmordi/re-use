namespace ReUse.Infrastructure.Interfaces.Services;

public interface IAppCache
{
    Task SetAsync<T>(string key, T value, TimeSpan ttl);
    Task<T?> GetAsync<T>(string key);
    Task RemoveAsync(string key);
}