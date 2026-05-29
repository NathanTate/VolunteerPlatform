using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Domain.Entities;
using VolunteerPlatform.Infrastructure.Persistence;

namespace VolunteerPlatform.Infrastructure.Services;

public class TokenService : ITokenService
{
  private readonly IConfiguration _configuration;
  private readonly ApplicationDbContext _context;

  public TokenService(IConfiguration configuration, ApplicationDbContext context)
  {
    _configuration = configuration;
    _context = context;
  }

  public async Task<AuthenticationResult> GenerateAuthenticationResultAsync(User user, string ipAddress)
  {
    var accessToken = CreateAccessToken(user);
    var refreshToken = CreateRefreshToken(ipAddress);

    user.RefreshTokens.Add(refreshToken);
    await _context.SaveChangesAsync();

    return new AuthenticationResult(
        accessToken,
        refreshToken.Token,
        refreshToken.Expires,
        user.Id,
        user.Role.ToString(),
        user.IsOrganizationApproved,
        user.OrganizationName
    );
  }

  public async Task<AuthenticationResult> RefreshAccessTokenAsync(string refreshToken, string ipAddress)
  {
    var existingToken = await _context.RefreshTokens
        .Include(rt => rt.User)
        .SingleOrDefaultAsync(rt => rt.Token == refreshToken);

    if (existingToken is null || !existingToken.IsActive)
    {
      throw new VolunteerPlatform.Application.Common.Exceptions.UnauthorizedAccessException("Refresh token is invalid or expired.");
    }

    var user = existingToken.User;
    var newRefreshToken = CreateRefreshToken(ipAddress);

    existingToken.RevokedAt = DateTime.UtcNow;
    existingToken.RevokedByIp = ipAddress;
    existingToken.ReplacedByToken = newRefreshToken.Token;
    _context.RefreshTokens.Add(newRefreshToken);

    await _context.SaveChangesAsync();

    return new AuthenticationResult(
        CreateAccessToken(user),
        newRefreshToken.Token,
        newRefreshToken.Expires,
        user.Id,
        user.Role.ToString(),
        user.IsOrganizationApproved,
        user.OrganizationName
    );
  }

  private string CreateAccessToken(User user)
  {
    var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
    var issuer = _configuration["Jwt:Issuer"];
    var audience = _configuration["Jwt:Audience"];
    var expires = DateTime.UtcNow.AddHours(1);

    var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName),
            new Claim("isOrganizationApproved", user.IsOrganizationApproved.ToString()),
            new Claim("organizationName", user.OrganizationName ?? string.Empty)
        };

    var tokenDescriptor = new SecurityTokenDescriptor
    {
      Subject = new ClaimsIdentity(claims),
      Expires = expires,
      SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
      Issuer = issuer,
      Audience = audience
    };

    var tokenHandler = new JwtSecurityTokenHandler();
    var token = tokenHandler.CreateToken(tokenDescriptor);
    return tokenHandler.WriteToken(token);
  }

  private RefreshToken CreateRefreshToken(string ipAddress)
  {
    var randomBytes = RandomNumberGenerator.GetBytes(64);
    return new RefreshToken
    {
      Token = Convert.ToBase64String(randomBytes),
      Expires = DateTime.UtcNow.AddDays(30),
      CreatedAt = DateTime.UtcNow,
      CreatedByIp = ipAddress
    };
  }
}
