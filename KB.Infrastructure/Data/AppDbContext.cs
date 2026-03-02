using System.Reflection;
using KB.Domain.Abstract;
using KB.Domain.Interfaces;
using KB.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data;

public class AppDbContext(
    DbContextOptions<AppDbContext> options,
    IDomainEventDispatcher? dispatcher) : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    private readonly IDomainEventDispatcher? _dispatcher = dispatcher;

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AiProfile> AiProfiles => Set<AiProfile>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ConversationMessage> ConversationMessages => Set<ConversationMessage>();
    public DbSet<MessageFeedback> MessageFeedbacks => Set<MessageFeedback>();
    public DbSet<UsageRecord> UsageRecords => Set<UsageRecord>();
    public DbSet<ConversationStarter> ConversationStarters => Set<ConversationStarter>();
    public DbSet<AiInvocation> AiInvocations => Set<AiInvocation>();
    public DbSet<KnowledgeBase> KnowledgeBases => Set<KnowledgeBase>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionOption> QuestionOptions => Set<QuestionOption>();
    public DbSet<OrganizationCourse> OrganizationCourses => Set<OrganizationCourse>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<QuestionAnswer> QuestionAnswers => Set<QuestionAnswer>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<DeviceRegistration> DeviceRegistrations => Set<DeviceRegistration>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
    {
        int result = await base.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        if (_dispatcher == null)
        {
            return result;
        }

        var entitiesWithEvents = ChangeTracker.Entries<DomainEntity>()
            .Select(e => e.Entity)
            .Where(e => e.DomainEvents.Any())
            .ToArray();

        await _dispatcher.DispatchAndClearEvents(entitiesWithEvents).ConfigureAwait(false);

        return result;
    }
}
