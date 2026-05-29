using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Dashboard.Queries.GetDashboardStats;

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IApplicationDbContext _context;

    public GetDashboardStatsQueryHandler(IApplicationDbContext context)
        => _context = context;

    public async Task<DashboardStatsDto> Handle(
        GetDashboardStatsQuery request,
        CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;

        // ── Initiatives (single grouped query) ──────────────────────────────
        var initiativeStats = await _context.Initiatives
            .GroupBy(i => 1)
            .Select(g => new
            {
                Total     = g.Count(),
                Active    = g.Count(i => i.Status == InitiativeStatus.Active),
                Planned   = g.Count(i => i.Status == InitiativeStatus.Planned),
                Completed = g.Count(i => i.Status == InitiativeStatus.Completed),
                Emergency = g.Count(i => i.IsEmergency && i.Status == InitiativeStatus.Active)
            })
            .FirstOrDefaultAsync(cancellationToken);

        // ── Tasks (single grouped query) ────────────────────────────────────
        var taskStats = await _context.Tasks
            .GroupBy(t => 1)
            .Select(g => new
            {
                Total      = g.Count(),
                Pending    = g.Count(t => t.Status == VolunteerTaskStatus.Pending),
                Accepted   = g.Count(t => t.Status == VolunteerTaskStatus.Accepted),
                InProgress = g.Count(t => t.Status == VolunteerTaskStatus.InProgress),
                Completed  = g.Count(t => t.Status == VolunteerTaskStatus.Completed),
                Verified   = g.Count(t => t.Status == VolunteerTaskStatus.Verified),
                Rejected   = g.Count(t => t.Status == VolunteerTaskStatus.Rejected),
                // Overdue = has deadline in the past AND not yet completed/verified/rejected
                Overdue    = g.Count(t =>
                    t.Deadline.HasValue &&
                    t.Deadline.Value < DateTime.UtcNow &&
                    t.Status != VolunteerTaskStatus.Completed &&
                    t.Status != VolunteerTaskStatus.Verified &&
                    t.Status != VolunteerTaskStatus.Rejected),
                // Completed today (Completed or Verified, updated today)
                CompletedToday = g.Count(t =>
                    (t.Status == VolunteerTaskStatus.Completed || t.Status == VolunteerTaskStatus.Verified) &&
                    t.UpdatedAt.Date == today)
            })
            .FirstOrDefaultAsync(cancellationToken);

        // ── Volunteers ───────────────────────────────────────────────────────
        var totalVolunteers = await _context.Users
            .CountAsync(u => u.Role == UserRole.Volunteer, cancellationToken);

        return new DashboardStatsDto
        {
            TotalInitiatives      = initiativeStats?.Total     ?? 0,
            ActiveInitiatives     = initiativeStats?.Active    ?? 0,
            PlannedInitiatives    = initiativeStats?.Planned   ?? 0,
            CompletedInitiatives  = initiativeStats?.Completed ?? 0,
            EmergencyInitiatives  = initiativeStats?.Emergency ?? 0,

            TotalTasks            = taskStats?.Total          ?? 0,
            TasksPending          = taskStats?.Pending        ?? 0,
            TasksAccepted         = taskStats?.Accepted       ?? 0,
            TasksInProgress       = taskStats?.InProgress     ?? 0,
            TasksCompleted        = taskStats?.Completed      ?? 0,
            TasksVerified         = taskStats?.Verified       ?? 0,
            TasksRejected         = taskStats?.Rejected       ?? 0,
            TasksOverdue          = taskStats?.Overdue        ?? 0,
            TasksCompletedToday   = taskStats?.CompletedToday ?? 0,

            TotalVolunteers       = totalVolunteers,
            GeneratedAt           = DateTime.UtcNow
        };
    }
}
