using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Application.Tasks.Queries;

namespace VolunteerPlatform.Application.Tasks.Queries.GetTaskById;

public class GetTaskByIdQueryHandler : IRequestHandler<GetTaskByIdQuery, TaskDto?>
{
    private readonly IApplicationDbContext _context;

    public GetTaskByIdQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<TaskDto?> Handle(GetTaskByIdQuery request, CancellationToken ct)
    {
        var task = await _context.Tasks
            .AsNoTracking()
            .Include(t => t.AssignedVolunteer)
            .Include(t => t.CreatedBy)
            .Include(t => t.Initiative)
            .Include(t => t.Comments.Where(c => !c.IsDeleted))
                .ThenInclude(c => c.Author)
            .Include(t => t.History)
                .ThenInclude(h => h.ChangedBy)
            .Include(t => t.Attachments)
                .ThenInclude(a => a.UploadedBy)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, ct);

        if (task == null) return null;

        return new TaskDto
        {
            Id = task.Id,
            InitiativeId = task.InitiativeId,
            InitiativeTitle = task.Initiative.Title,
            Title = task.Title,
            Description = task.Description,
            Priority = task.Priority.ToString(),
            Status = task.Status.ToString(),
            AssignedVolunteerId = task.AssignedVolunteerId,
            AssignedVolunteerName = task.AssignedVolunteer != null
                ? $"{task.AssignedVolunteer.FirstName} {task.AssignedVolunteer.LastName}"
                : null,
            CreatedById = task.CreatedById,
            InitiativeOrganizerId = task.Initiative.OrganizerId,
            CreatedByName = $"{task.CreatedBy.FirstName} {task.CreatedBy.LastName}",
            Deadline = task.Deadline,
            CompletionProofUrl = task.CompletionProofUrl,
            VerificationNote = task.VerificationNote,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            Comments = task.Comments
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new TaskCommentDto
                {
                    Id = c.Id,
                    AuthorId = c.AuthorId,
                    AuthorName = $"{c.Author.FirstName} {c.Author.LastName}",
                    Text = c.Text,
                    CreatedAt = c.CreatedAt
                }).ToList(),
            History = task.History
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new TaskHistoryDto
                {
                    Id = h.Id,
                    ChangedByName = $"{h.ChangedBy.FirstName} {h.ChangedBy.LastName}",
                    FromStatus = h.FromStatus.ToString(),
                    ToStatus = h.ToStatus.ToString(),
                    Note = h.Note,
                    ChangedAt = h.ChangedAt
                }).ToList(),
            Attachments = task.Attachments
                .OrderByDescending(a => a.UploadedAt)
                .Select(a => new TaskAttachmentDto
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    Url = a.Url,
                    ContentType = a.ContentType,
                    FileSizeBytes = a.FileSizeBytes,
                    UploadedByName = $"{a.UploadedBy.FirstName} {a.UploadedBy.LastName}",
                    UploadedAt = a.UploadedAt
                }).ToList()
        };
    }
}
