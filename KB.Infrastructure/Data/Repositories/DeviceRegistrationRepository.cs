using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KB.Infrastructure.Data.Repositories;

public sealed class DeviceRegistrationRepository(AppDbContext dbContext) : EfRepository<DeviceRegistration>(dbContext), IDeviceRegistrationRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<DeviceRegistration?> GetByPushTokenAsync(string pushToken, CancellationToken cancellationToken = default)
    {
        return await _dbContext.DeviceRegistrations
            .FirstOrDefaultAsync(d => d.PushToken == pushToken, cancellationToken)
            .ConfigureAwait(false);
    }
}
