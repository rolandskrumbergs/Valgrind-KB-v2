using KB.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KB.Infrastructure.Data.Configurations;

public class KnowledgeBaseConfiguration : IEntityTypeConfiguration<KnowledgeBase>
{
    public void Configure(EntityTypeBuilder<KnowledgeBase> builder)
    {
        builder.ToTable("KnowledgeBases");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .HasMaxLength(200);

        builder.Property(e => e.Slug)
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasMaxLength(2000);

        builder.Property(e => e.BlobContainerName)
            .HasMaxLength(200);

        builder.Property(e => e.SearchIndexPrefix)
            .HasMaxLength(200);

        builder.HasIndex(e => e.Name)
            .IsUnique();

        builder.HasIndex(e => e.Slug)
            .IsUnique();

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
