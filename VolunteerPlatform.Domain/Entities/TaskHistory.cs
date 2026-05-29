using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Domain.Entities;

public class TaskHistory
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public VolunteerTask Task { get; set; } = null!;

    public string ChangedById { get; set; } = string.Empty;
    public User ChangedBy { get; set; } = null!;

    public VolunteerTaskStatus FromStatus { get; set; }
    public VolunteerTaskStatus ToStatus { get; set; }
    public string? Note { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
