using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VolunteerPlatform.Domain.Entities;

namespace VolunteerPlatform.Infrastructure.Persistence.Configurations;

public class ApplicationRequestConfiguration : IEntityTypeConfiguration<ApplicationRequest>
{
    public void Configure(EntityTypeBuilder<ApplicationRequest> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(a => a.Comment).HasMaxLength(1000);

        builder.HasOne(a => a.Initiative)
            .WithMany(i => i.Applications)
            .HasForeignKey(a => a.InitiativeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.User)
            .WithMany(u => u.Applications)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => new { a.InitiativeId, a.UserId }).IsUnique();
    }
}
