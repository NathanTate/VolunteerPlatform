using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Domain.Entities;

namespace VolunteerPlatform.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Initiative> Initiatives { get; }
    DbSet<InitiativeImage> InitiativeImages { get; }
    DbSet<ApplicationRequest> ApplicationRequests { get; }
    DbSet<User> Users { get; }
    DbSet<VolunteerTask> Tasks { get; }
    DbSet<TaskComment> TaskComments { get; }
    DbSet<TaskHistory> TaskHistories { get; }
    DbSet<TaskAttachment> TaskAttachments { get; }
    DbSet<UserNotification> Notifications { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
