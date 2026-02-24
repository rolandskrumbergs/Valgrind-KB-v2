using KB.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KB.Infrastructure.Data.Configurations;

public class ConversationStarterConfiguration : IEntityTypeConfiguration<ConversationStarter>
{
    public void Configure(EntityTypeBuilder<ConversationStarter> builder)
    {
        builder.ToTable("ConversationStarters");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Text)
            .HasMaxLength(500);
    }
}
