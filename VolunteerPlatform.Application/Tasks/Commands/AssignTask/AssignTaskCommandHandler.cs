using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Entities;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Tasks.Commands.AssignTask;

public class AssignTaskCommandHandler : IRequestHandler<AssignTaskCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notifications;

    public AssignTaskCommandHandler(IApplicationDbContext context, INotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task Handle(AssignTaskCommand request, CancellationToken ct)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException($"Task {request.TaskId} not found.");

        var volunteer = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.VolunteerId, ct)
            ?? throw new KeyNotFoundException($"User {request.VolunteerId} not found.");

        var previousStatus = task.Status;
        task.AssignedVolunteerId = request.VolunteerId;
        task.Status = VolunteerTaskStatus.Accepted;
        task.UpdatedAt = DateTime.UtcNow;

        _context.TaskHistories.Add(new TaskHistory
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            ChangedById = request.RequestingUserId,
            FromStatus = previousStatus,
            ToStatus = VolunteerTaskStatus.Accepted,
            Note = $"Assigned to {volunteer.FirstName} {volunteer.LastName}",
            ChangedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);
        await _notifications.NotifyTaskAssigned(task.Id, task.Title, request.VolunteerId);
        await _notifications.NotifyDashboardUpdated();
    }
}
