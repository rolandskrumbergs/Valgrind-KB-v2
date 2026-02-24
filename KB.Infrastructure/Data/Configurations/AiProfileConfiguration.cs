using KB.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KB.Infrastructure.Data.Configurations;

public class AiProfileConfiguration : IEntityTypeConfiguration<AiProfile>
{
    public void Configure(EntityTypeBuilder<AiProfile> builder)
    {
        builder.ToTable("AiProfiles");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .HasMaxLength(200);

        builder.Property(e => e.Model)
            .HasMaxLength(100);

        builder.Property(e => e.MinRelevanceThreshold)
            .HasPrecision(5, 4);

        builder.Property(e => e.HighConfidenceThreshold)
            .HasPrecision(5, 4);

        builder.HasOne(e => e.KnowledgeBase)
            .WithMany(kb => kb.AiProfiles)
            .HasForeignKey(e => e.KnowledgeBaseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => e.Name)
            .IsUnique();

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
