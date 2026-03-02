using KB.Domain.Entities;

namespace KB.Domain.Interfaces.Repositories;

public interface IDeviceRegistrationRepository : IRepository<DeviceRegistration>
{
    Task<DeviceRegistration?> GetByPushTokenAsync(string pushToken, CancellationToken cancellationToken = default);
}
