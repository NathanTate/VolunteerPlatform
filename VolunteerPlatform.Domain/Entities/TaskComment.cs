namespace VolunteerPlatform.Domain.Entities;

public class TaskComment
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public VolunteerTask Task { get; set; } = null!;

    public string AuthorId { get; set; } = string.Empty;
    public User Author { get; set; } = null!;

    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; }
}
