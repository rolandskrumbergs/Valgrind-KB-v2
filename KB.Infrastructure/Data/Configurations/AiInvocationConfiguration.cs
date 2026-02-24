using KB.Domain.Entities;
using KB.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KB.Infrastructure.Data.Configurations;

public class AiInvocationConfiguration : IEntityTypeConfiguration<AiInvocation>
{
    public void Configure(EntityTypeBuilder<AiInvocation> builder)
    {
        builder.ToTable("AiInvocations");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.SearchQuery)
            .HasMaxLength(2000);

        builder.Property(e => e.ConversationSummary)
            .HasColumnType("text");

        builder.Property(e => e.Outcome)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(e => e.OutcomeReason)
            .HasMaxLength(1000);

        builder.Property(e => e.RetrievedChunks)
            .HasColumnType("jsonb");

        builder.Property(e => e.QualityMetrics)
            .HasColumnType("jsonb");

        builder.Property(e => e.Model)
            .HasMaxLength(100);

        builder.Property(e => e.AiProfileSnapshot)
            .HasColumnType("jsonb");

        builder.HasOne(e => e.Conversation)
            .WithMany()
            .HasForeignKey(e => e.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Message)
            .WithMany()
            .HasForeignKey(e => e.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.ConversationId);
        builder.HasIndex(e => e.UserId);
        builder.HasIndex(e => e.CreatedAt);
    }
}
