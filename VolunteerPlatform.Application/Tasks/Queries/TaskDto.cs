namespace VolunteerPlatform.Application.Tasks.Queries;

public class TaskDto
{
    public Guid Id { get; set; }
    public Guid InitiativeId { get; set; }
    public string InitiativeTitle { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? AssignedVolunteerId { get; set; }
    public string? AssignedVolunteerName { get; set; }
    public string CreatedById { get; set; } = string.Empty;
    public string InitiativeOrganizerId { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime? Deadline { get; set; }
    public string? CompletionProofUrl { get; set; }
    public string? VerificationNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsOverdue => Deadline.HasValue && Deadline.Value < DateTime.UtcNow &&
                             Status != "Completed" && Status != "Verified";
    public List<TaskCommentDto> Comments { get; set; } = new();
    public List<TaskHistoryDto> History { get; set; } = new();
    public List<TaskAttachmentDto> Attachments { get; set; } = new();
}

public class TaskCommentDto
{
    public Guid Id { get; set; }
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class TaskHistoryDto
{
    public Guid Id { get; set; }
    public string ChangedByName { get; set; } = string.Empty;
    public string FromStatus { get; set; } = string.Empty;
    public string ToStatus { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime ChangedAt { get; set; }
}

public class TaskAttachmentDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string UploadedByName { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
}

public class TaskSummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? AssignedVolunteerName { get; set; }
    public DateTime? Deadline { get; set; }
    public bool IsOverdue => Deadline.HasValue && Deadline.Value < DateTime.UtcNow &&
                             Status != "Completed" && Status != "Verified";
}
