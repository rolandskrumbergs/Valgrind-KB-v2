using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Infrastructure.Data.Repositories;

public sealed class ArticleRepository(AppDbContext dbContext) : EfRepository<Article>(dbContext), IArticleRepository
{
}
