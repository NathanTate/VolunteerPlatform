using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Entities;

namespace VolunteerPlatform.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IRepository<Initiative>? _initiativeRepository;
    private IRepository<ApplicationRequest>? _applicationRequestRepository;
    private IRepository<User>? _userRepository;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IRepository<Initiative> Initiatives => _initiativeRepository ??= new Repository<Initiative>(_context);
    public IRepository<ApplicationRequest> ApplicationRequests => _applicationRequestRepository ??= new Repository<ApplicationRequest>(_context);
    public IRepository<User> Users => _userRepository ??= new Repository<User>(_context);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}
