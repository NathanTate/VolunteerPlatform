using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Infrastructure.Persistence;

public class Repository<TEntity> : IRepository<TEntity> where TEntity : class
{
    protected readonly DbContext Context;
    protected readonly DbSet<TEntity> Entities;

    public Repository(DbContext context)
    {
        Context = context;
        Entities = context.Set<TEntity>();
    }

    public IQueryable<TEntity> Query() => Entities.AsNoTracking();

    public async Task<TEntity?> GetByIdAsync(object[] keyValues, CancellationToken cancellationToken = default)
    {
        var entity = await Entities.FindAsync(keyValues, cancellationToken);
        return entity is null ? null : entity;
    }

    public async Task AddAsync(TEntity entity, CancellationToken cancellationToken = default)
    {
        await Entities.AddAsync(entity, cancellationToken);
    }

    public void Update(TEntity entity)
    {
        Entities.Update(entity);
    }

    public void Remove(TEntity entity)
    {
        Entities.Remove(entity);
    }
}
