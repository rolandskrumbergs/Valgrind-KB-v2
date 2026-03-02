using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data.Repositories;

public sealed class EnrollmentRepository(AppDbContext dbContext) : EfRepository<Enrollment>(dbContext), IEnrollmentRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<Enrollment?> GetByUserAndCourseAsync(Guid userId, Guid courseId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Enrollments
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId, cancellationToken)
            .ConfigureAwait(false);
    }
}
