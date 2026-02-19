using System.Reflection;
using Microsoft.Extensions.DependencyInjection;

namespace KB.Core;

public static class Setup
{
    public static IServiceCollection AddCore(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        var handlerTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && t.Name.EndsWith("Handler"));

        foreach (var handlerType in handlerTypes)
        {
            services.AddScoped(handlerType);
        }

        return services;
    }
}
