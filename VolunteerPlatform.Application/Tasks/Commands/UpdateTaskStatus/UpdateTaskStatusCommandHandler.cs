using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Entities;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Tasks.Commands.UpdateTaskStatus;

public class UpdateTaskStatusCommandHandler : IRequestHandler<UpdateTaskStatusCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notifications;

    private static readonly Dictionary<VolunteerTaskStatus, HashSet<VolunteerTaskStatus>> AllowedTransitions = new()
    {
        [VolunteerTaskStatus.Pending]    = new() { VolunteerTaskStatus.Accepted, VolunteerTaskStatus.Rejected },
        [VolunteerTaskStatus.Accepted]   = new() { VolunteerTaskStatus.InProgress, VolunteerTaskStatus.Pending, VolunteerTaskStatus.Rejected },
        [VolunteerTaskStatus.InProgress] = new() { VolunteerTaskStatus.Completed, VolunteerTaskStatus.Accepted, VolunteerTaskStatus.Rejected },
        [VolunteerTaskStatus.Completed]  = new() { VolunteerTaskStatus.Verified, VolunteerTaskStatus.InProgress, VolunteerTaskStatus.Rejected },
        [VolunteerTaskStatus.Verified]   = new() { VolunteerTaskStatus.Completed },
        [VolunteerTaskStatus.Rejected]   = new() { VolunteerTaskStatus.Pending },
    };

    public UpdateTaskStatusCommandHandler(IApplicationDbContext context, INotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task Handle(UpdateTaskStatusCommand request, CancellationToken ct)
    {
        var task = await _context.Tasks
            .Include(t => t.Initiative)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException($"Task {request.TaskId} not found.");

        // Only the initiative organiser or an admin may change task status
        var isOrganizer = task.Initiative.OrganizerId == request.RequestingUserId;
        if (!isOrganizer && !request.IsAdmin)
            throw new VolunteerPlatform.Application.Common.Exceptions.UnauthorizedAccessException(
                "Only the initiative organiser or an admin may update task status.");

        if (!AllowedTransitions.TryGetValue(task.Status, out var allowed) || !allowed.Contains(request.NewStatus))
            throw new InvalidOperationException(
                $"Transition from {task.Status} to {request.NewStatus} is not allowed.");

        var previousStatus = task.Status;
        task.Status    = request.NewStatus;
        task.UpdatedAt = DateTime.UtcNow;

        if (request.NewStatus == VolunteerTaskStatus.Completed && !string.IsNullOrEmpty(request.CompletionProofUrl))
            task.CompletionProofUrl = request.CompletionProofUrl;

        if (request.NewStatus == VolunteerTaskStatus.Verified || request.NewStatus == VolunteerTaskStatus.Rejected)
            task.VerificationNote = request.Note;

        _context.TaskHistories.Add(new TaskHistory
        {
            Id          = Guid.NewGuid(),
            TaskId      = task.Id,
            ChangedById = request.RequestingUserId,
            FromStatus  = previousStatus,
            ToStatus    = request.NewStatus,
            Note        = request.Note,
            ChangedAt   = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);
        await _notifications.NotifyTaskUpdated(task.Id, task.Title, request.NewStatus.ToString());
        await _notifications.NotifyDashboardUpdated();
    }
}
