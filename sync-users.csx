using KB.Domain.Entities;
using KB.Domain.Enums;
using KB.Infrastructure.Data;
using KB.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;

var connectionString = "Host=localhost;Database=KnowledgeBase;Username=postgres;Password=admin";
var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
optionsBuilder.UseNpgsql(connectionString);

using (var context = new AppDbContext(optionsBuilder.Options, null))
{
    var aspNetUsers = await context.Set<ApplicationUser>().ToListAsync();
    
    foreach (var aspUser in aspNetUsers)
    {
        var domainUser = await context.Users.FindAsync(aspUser.Id);
        if (domainUser == null)
        {
            var role = aspUser.Email == "admin@kb.local" ? UserRole.Admin : UserRole.User;
            domainUser = new User(aspUser.Id, aspUser.Email!, role);
            domainUser.ConfirmEmail();
            context.Users.Add(domainUser);
            Console.WriteLine(\$"Created domain User for {aspUser.Email}");
        }
    }
    
    await context.SaveChangesAsync();
    Console.WriteLine("Done!");
}
