using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VolunteerPlatform.Domain.Entities;

namespace VolunteerPlatform.Infrastructure.Persistence.Configurations;

public class InitiativeConfiguration : IEntityTypeConfiguration<Initiative>
{
    public void Configure(EntityTypeBuilder<Initiative> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Title).HasMaxLength(200).IsRequired();
        builder.Property(i => i.Description).HasMaxLength(2000).IsRequired();
        builder.Property(i => i.Address).HasMaxLength(500).IsRequired();
        builder.Property(i => i.Category).HasConversion<string>().HasMaxLength(30);
        builder.Property(i => i.UrgencyLevel).HasConversion<string>().HasMaxLength(20);
        builder.Property(i => i.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(i => i.Latitude).IsRequired();
        builder.Property(i => i.Longitude).IsRequired();
        builder.Property(i => i.RadiusKm).HasDefaultValue(5.0);
        builder.Property(i => i.RequiredVolunteers).HasDefaultValue(0);

        builder.HasOne(i => i.Organizer)
            .WithMany(u => u.CreatedInitiatives)
            .HasForeignKey(i => i.OrganizerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes for performance
        builder.HasIndex(i => new { i.Latitude, i.Longitude });
        builder.HasIndex(i => i.Status);
        builder.HasIndex(i => i.Category);
        builder.HasIndex(i => i.UrgencyLevel);
        builder.HasIndex(i => i.IsEmergency);

        // Global query filter for soft delete
        builder.HasQueryFilter(i => !i.IsDeleted);
    }
}
