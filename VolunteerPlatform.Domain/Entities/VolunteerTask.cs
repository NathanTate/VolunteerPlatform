using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Domain.Entities;

public class VolunteerTask
{
    public Guid Id { get; set; }
    public Guid InitiativeId { get; set; }
    public Initiative Initiative { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public VolunteerTaskStatus Status { get; set; } = VolunteerTaskStatus.Pending;

    /// <summary>ID of the volunteer assigned to this task (nullable until assigned).</summary>
    public string? AssignedVolunteerId { get; set; }
    public User? AssignedVolunteer { get; set; }

    /// <summary>ID of the coordinator who created this task.</summary>
    public string CreatedById { get; set; } = string.Empty;
    public User CreatedBy { get; set; } = null!;

    public DateTime? Deadline { get; set; }

    /// <summary>URL or path to the completion proof uploaded by the volunteer.</summary>
    public string? CompletionProofUrl { get; set; }

    /// <summary>Coordinator's verification note.</summary>
    public string? VerificationNote { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; }

    public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
    public ICollection<TaskHistory> History { get; set; } = new List<TaskHistory>();
    public ICollection<TaskAttachment> Attachments { get; set; } = new List<TaskAttachment>();
}
