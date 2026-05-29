using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VolunteerPlatform.Domain.Entities;

namespace VolunteerPlatform.Infrastructure.Persistence.Configurations;

public class InitiativeImageConfiguration : IEntityTypeConfiguration<InitiativeImage>
{
    public void Configure(EntityTypeBuilder<InitiativeImage> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Url).HasMaxLength(1000).IsRequired();
        builder.Property(i => i.AltText).HasMaxLength(300);

        builder.HasOne(i => i.Initiative)
            .WithMany(ini => ini.Images)
            .HasForeignKey(i => i.InitiativeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(i => i.InitiativeId);
    }
}
