using KB.Domain.Entities;
using KB.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KB.Infrastructure.Data.Configurations;

public class ConversationMessageConfiguration : IEntityTypeConfiguration<ConversationMessage>
{
    public void Configure(EntityTypeBuilder<ConversationMessage> builder)
    {
        builder.ToTable("ConversationMessages");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Role)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(e => e.Content)
            .HasColumnType("text");

        builder.Property(e => e.Parts)
            .HasColumnType("jsonb");

        builder.Property(e => e.AiProfileSnapshot)
            .HasColumnType("jsonb");

        builder.HasQueryFilter(e => !e.Conversation.User.IsDeleted);

        builder.HasOne(e => e.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(e => e.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.ConversationId);
    }
}
