using KB.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KB.Infrastructure.Data.Configurations;

public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.ToTable("Organizations");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .HasMaxLength(300);

        builder.Property(e => e.ContactInfo)
            .HasColumnType("jsonb");

        builder.Property(e => e.InvoiceInfo)
            .HasColumnType("jsonb");

        builder.HasMany(e => e.Subscriptions)
            .WithOne(s => s.Organization)
            .HasForeignKey(s => s.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
