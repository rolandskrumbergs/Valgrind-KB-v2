using KB.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KB.Infrastructure.Data.Configurations;

public class ChapterConfiguration : IEntityTypeConfiguration<Chapter>
{
    public void Configure(EntityTypeBuilder<Chapter> builder)
    {
        builder.ToTable("Chapters");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title)
            .HasMaxLength(500);

        builder.Property(e => e.Description)
            .HasColumnType("text");

        builder.Property(e => e.VideoUrl)
            .HasMaxLength(1000);

        builder.HasMany(e => e.Questions)
            .WithOne(q => q.Chapter)
            .HasForeignKey(q => q.ChapterId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
