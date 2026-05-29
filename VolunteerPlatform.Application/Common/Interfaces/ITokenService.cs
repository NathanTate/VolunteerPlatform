using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Domain.Entities;

namespace VolunteerPlatform.Application.Common.Interfaces;

public interface ITokenService
{
  Task<AuthenticationResult> GenerateAuthenticationResultAsync(User user, string ipAddress);
  Task<AuthenticationResult> RefreshAccessTokenAsync(string refreshToken, string ipAddress);
}
