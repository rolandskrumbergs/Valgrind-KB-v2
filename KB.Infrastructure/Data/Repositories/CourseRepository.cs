using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data.Repositories;

public sealed class CourseRepository(AppDbContext dbContext) : EfRepository<Course>(dbContext), ICourseRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<Course?> GetWithChaptersAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Courses
            .Include(c => c.Chapters.OrderBy(ch => ch.SortOrder))
                .ThenInclude(ch => ch.Questions)
                    .ThenInclude(q => q.Options.OrderBy(o => o.SortOrder))
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }
}
