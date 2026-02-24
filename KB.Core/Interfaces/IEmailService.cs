namespace KB.Core.Interfaces;

public interface IEmailService
{
    Task SendMfaCodeAsync(string email, string code, CancellationToken cancellationToken = default);
}
