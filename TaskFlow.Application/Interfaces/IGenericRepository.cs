
using System.Linq.Expressions;
using TaskFlow.Domain.Common;

namespace TaskFlow.Application.Interfaces
{
    public interface IGenericRepository<T> where T : BaseEntity
    {
        Task<T?> GetByIdAsync(Guid id);
        Task<List<T>> GetAllAsync();
        Task<T?> GetByIdWithIncludesAsync(
            Guid id,
            params Expression<Func<T, object>>[] includes);
        Task<T?> GetByIdWithFullIncludeAsync(
            Guid id,
            Func<IQueryable<T>, IQueryable<T>> include);
        Task AddAsync(T entity);
        void Update(T entity);
        void Delete(T entity);
        Task SaveChangesAsync();

        IQueryable<T> Query();
    }
}
