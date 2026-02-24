namespace KB.Core.Interfaces;

public interface ITotpService
{
    string GenerateSecret();
    string GenerateCode(string secret);
    bool ValidateCode(string secret, string code);
    string GenerateQrCodeUri(string email, string secret, string issuer = "KB");
}
