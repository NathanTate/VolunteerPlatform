using VolunteerPlatform.Domain.Entities;

namespace VolunteerPlatform.Application.Common.Interfaces;

public interface IUnitOfWork
{
    IRepository<Initiative> Initiatives { get; }
    IRepository<ApplicationRequest> ApplicationRequests { get; }
    IRepository<User> Users { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
