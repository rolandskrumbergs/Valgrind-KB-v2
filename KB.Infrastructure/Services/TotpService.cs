using System.Security.Cryptography;
using System.Text;

namespace KB.Infrastructure.Services;

public class TotpService : ITotpService
{
    private const int TimeStep = 30;
    private const int CodeDigits = 6;

    public string GenerateSecret()
    {
        var bytes = new byte[20];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    public string GenerateCode(string secret)
    {
        var secretBytes = Convert.FromBase64String(secret);
        var counter = GetCurrentCounter();
        return GenerateTotp(secretBytes, counter);
    }

    public bool ValidateCode(string secret, string code)
    {
        var secretBytes = Convert.FromBase64String(secret);
        var counter = GetCurrentCounter();

        for (int i = -1; i <= 1; i++)
        {
            var generatedCode = GenerateTotp(secretBytes, counter + i);
            if (generatedCode == code)
            {
                return true;
            }
        }

        return false;
    }

    public string GenerateQrCodeUri(string email, string secret, string issuer = "KB")
    {
        var secretBase32 = ConvertToBase32(Convert.FromBase64String(secret));
        return $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{Uri.EscapeDataString(email)}?secret={secretBase32}&issuer={Uri.EscapeDataString(issuer)}&digits={CodeDigits}&period={TimeStep}";
    }

    private static long GetCurrentCounter()
    {
        var unixTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        return unixTimestamp / TimeStep;
    }

    private static string GenerateTotp(byte[] secret, long counter)
    {
        var counterBytes = BitConverter.GetBytes(counter);
        if (BitConverter.IsLittleEndian)
        {
            Array.Reverse(counterBytes);
        }

        using var hmac = new HMACSHA1(secret);
        var hash = hmac.ComputeHash(counterBytes);

        var offset = hash[^1] & 0x0F;
        var binary = ((hash[offset] & 0x7F) << 24)
                   | ((hash[offset + 1] & 0xFF) << 16)
                   | ((hash[offset + 2] & 0xFF) << 8)
                   | (hash[offset + 3] & 0xFF);

        var otp = binary % (int)Math.Pow(10, CodeDigits);
        return otp.ToString($"D{CodeDigits}");
    }

    private static string ConvertToBase32(byte[] input)
    {
        const string base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var result = new StringBuilder();
        var buffer = 0;
        var bitsRemaining = 0;

        foreach (var b in input)
        {
            buffer = (buffer << 8) | b;
            bitsRemaining += 8;

            while (bitsRemaining >= 5)
            {
                var index = (buffer >> (bitsRemaining - 5)) & 0x1F;
                result.Append(base32Chars[index]);
                bitsRemaining -= 5;
            }
        }

        if (bitsRemaining > 0)
        {
            var index = (buffer << (5 - bitsRemaining)) & 0x1F;
            result.Append(base32Chars[index]);
        }

        return result.ToString();
    }
}
