using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VolunteerPlatform.Domain.Entities;

namespace VolunteerPlatform.Infrastructure.Persistence.Configurations;

public class VolunteerTaskConfiguration : IEntityTypeConfiguration<VolunteerTask>
{
    public void Configure(EntityTypeBuilder<VolunteerTask> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Title).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(2000).IsRequired();
        builder.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(t => t.Priority).HasConversion<string>().HasMaxLength(20);
        builder.Property(t => t.CompletionProofUrl).HasMaxLength(1000);
        builder.Property(t => t.VerificationNote).HasMaxLength(1000);

        builder.HasOne(t => t.Initiative)
            .WithMany(i => i.Tasks)
            .HasForeignKey(t => t.InitiativeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.AssignedVolunteer)
            .WithMany()
            .HasForeignKey(t => t.AssignedVolunteerId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasOne(t => t.CreatedBy)
            .WithMany()
            .HasForeignKey(t => t.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(t => !t.IsDeleted);

        builder.HasIndex(t => t.InitiativeId);
        builder.HasIndex(t => t.AssignedVolunteerId);
        builder.HasIndex(t => t.Status);
    }
}
