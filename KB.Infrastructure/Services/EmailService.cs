using Microsoft.Extensions.Logging;

namespace KB.Infrastructure.Services;

public class EmailService(ILogger<EmailService> logger) : IEmailService
{
    private readonly ILogger<EmailService> _logger = logger;

    public Task SendMfaCodeAsync(string email, string code, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("MFA Code for {Email}: {Code}", email, code);
        return Task.CompletedTask;
    }
}
