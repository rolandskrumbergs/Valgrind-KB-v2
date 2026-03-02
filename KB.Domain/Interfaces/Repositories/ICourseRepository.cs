using KB.Domain.Entities;

namespace KB.Domain.Interfaces.Repositories;

public interface ICourseRepository : IRepository<Course>
{
    Task<Course?> GetWithChaptersAsync(Guid id, CancellationToken cancellationToken = default);
}
