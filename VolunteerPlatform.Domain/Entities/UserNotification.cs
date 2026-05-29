using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Domain.Entities;

public class UserNotification
{
    public Guid Id { get; set; }

    /// <summary>Null means the notification is broadcast to all users.</summary>
    public string? UserId { get; set; }
    public User? User { get; set; }

    public NotificationType Type { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    /// <summary>Optional ID of the related Initiative or Task.</summary>
    public Guid? RelatedEntityId { get; set; }

    /// <summary>"Initiative" | "Task" — used by the frontend to build the navigation link.</summary>
    public string? RelatedEntityType { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
