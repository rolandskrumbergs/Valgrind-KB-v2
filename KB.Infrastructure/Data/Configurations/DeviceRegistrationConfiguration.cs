using KB.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KB.Infrastructure.Data.Configurations;

public class DeviceRegistrationConfiguration : IEntityTypeConfiguration<DeviceRegistration>
{
    public void Configure(EntityTypeBuilder<DeviceRegistration> builder)
    {
        builder.ToTable("DeviceRegistrations");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.PushToken)
            .HasMaxLength(500);

        builder.Property(e => e.Platform)
            .HasMaxLength(20);

        builder.Property(e => e.AppVersion)
            .HasMaxLength(50);

        builder.HasQueryFilter(e => !e.User.IsDeleted);

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.PushToken)
            .IsUnique();
    }
}
