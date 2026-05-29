namespace VolunteerPlatform.Domain.Entities;

public class RefreshToken
{
  public Guid Id { get; set; }
  public string Token { get; set; } = string.Empty;
  public DateTime Expires { get; set; }
  public DateTime CreatedAt { get; set; }
  public string CreatedByIp { get; set; } = string.Empty;
  public DateTime? RevokedAt { get; set; }
  public string? RevokedByIp { get; set; }
  public string? ReplacedByToken { get; set; }
  public string UserId { get; set; } = string.Empty;
  public User User { get; set; } = null!;

  public bool IsExpired => DateTime.UtcNow >= Expires;
  public bool IsActive => RevokedAt == null && !IsExpired;
}
