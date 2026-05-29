namespace VolunteerPlatform.Domain.Entities;

public class InitiativeImage
{
    public Guid Id { get; set; }
    public Guid InitiativeId { get; set; }
    public Initiative Initiative { get; set; } = null!;
    public string Url { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public bool IsCover { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
