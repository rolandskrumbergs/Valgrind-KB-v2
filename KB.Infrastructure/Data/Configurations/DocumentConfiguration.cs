using KB.Domain.Entities;
using KB.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KB.Infrastructure.Data.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.ToTable("Documents");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.FileName)
            .HasMaxLength(500);

        builder.Property(e => e.ContentType)
            .HasMaxLength(200);

        builder.Property(e => e.Category)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(e => e.BlobPath)
            .HasMaxLength(1000);

        builder.Property(e => e.ContentHash)
            .HasMaxLength(128);

        builder.Property(e => e.ChunkingPreset)
            .HasMaxLength(50);

        builder.Property(e => e.ProcessingStatus)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(e => e.ProcessingProgress)
            .HasColumnType("jsonb");

        builder.Property(e => e.ProcessingMetrics)
            .HasColumnType("jsonb");

        builder.Property(e => e.ErrorMessage)
            .HasMaxLength(2000);

        builder.HasOne(e => e.KnowledgeBase)
            .WithMany(kb => kb.Documents)
            .HasForeignKey(e => e.KnowledgeBaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.UploadedByUser)
            .WithMany()
            .HasForeignKey(e => e.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => new { e.KnowledgeBaseId, e.ContentHash })
            .IsUnique();

        builder.HasIndex(e => e.KnowledgeBaseId);
        builder.HasIndex(e => e.ProcessingStatus);
    }
}
