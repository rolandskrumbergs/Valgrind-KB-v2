using KB.Domain.Entities;

namespace KB.Server.Endpoints.WeatherForecasts;

internal static class GetWeatherForecastEndpoint
{
    private static readonly string[] Summaries =
    [
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    ];

    public static IEndpointRouteBuilder MapGetWeatherForecast(this IEndpointRouteBuilder endpoints)
    {
        endpoints
            .MapGet("/api/weatherforecast", GetWeatherForecast)
            .WithName("GetWeatherForecast")
            .WithTags("WeatherForecasts")
            .Produces<WeatherForecast[]>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status500InternalServerError);

        return endpoints;
    }

    private static WeatherForecast[] GetWeatherForecast()
    {
        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)]
        })
        .ToArray();
    }
}
