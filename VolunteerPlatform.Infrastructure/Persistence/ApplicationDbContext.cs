using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Entities;
using VolunteerPlatform.Infrastructure.Persistence.Configurations;

namespace VolunteerPlatform.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<User>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Initiative> Initiatives => Set<Initiative>();
    public DbSet<InitiativeImage> InitiativeImages => Set<InitiativeImage>();
    public DbSet<ApplicationRequest> ApplicationRequests => Set<ApplicationRequest>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public new DbSet<User> Users => Set<User>();
    public DbSet<VolunteerTask> Tasks => Set<VolunteerTask>();
    public DbSet<TaskComment> TaskComments => Set<TaskComment>();
    public DbSet<TaskHistory> TaskHistories => Set<TaskHistory>();
    public DbSet<TaskAttachment> TaskAttachments => Set<TaskAttachment>();
    public DbSet<UserNotification> Notifications => Set<UserNotification>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfiguration(new InitiativeConfiguration());
        builder.ApplyConfiguration(new ApplicationRequestConfiguration());
        builder.ApplyConfiguration(new UserConfiguration());
        builder.ApplyConfiguration(new InitiativeImageConfiguration());
        builder.ApplyConfiguration(new VolunteerTaskConfiguration());
        builder.ApplyConfiguration(new TaskCommentConfiguration());
        builder.ApplyConfiguration(new TaskHistoryConfiguration());
        builder.ApplyConfiguration(new TaskAttachmentConfiguration());
        builder.ApplyConfiguration(new UserNotificationConfiguration());

        builder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(rt => rt.Id);
            entity.Property(rt => rt.Token).IsRequired();
            entity.Property(rt => rt.CreatedAt).IsRequired();
            entity.HasOne(rt => rt.User)
                  .WithMany(u => u.RefreshTokens)
                  .HasForeignKey(rt => rt.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
