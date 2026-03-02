using KB.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KB.Infrastructure.Data.Configurations;

public class OrganizationCourseConfiguration : IEntityTypeConfiguration<OrganizationCourse>
{
    public void Configure(EntityTypeBuilder<OrganizationCourse> builder)
    {
        builder.ToTable("OrganizationCourses");

        builder.HasKey(e => new { e.OrganizationId, e.CourseId });

        builder.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Course)
            .WithMany(c => c.OrganizationCourses)
            .HasForeignKey(e => e.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.SharedByUser)
            .WithMany()
            .HasForeignKey(e => e.SharedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
