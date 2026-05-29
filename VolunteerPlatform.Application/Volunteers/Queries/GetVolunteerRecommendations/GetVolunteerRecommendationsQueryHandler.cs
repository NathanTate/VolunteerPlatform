using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Volunteers.Queries.GetVolunteerRecommendations;

public class GetVolunteerRecommendationsQueryHandler
    : IRequestHandler<GetVolunteerRecommendationsQuery, List<VolunteerRecommendationDto>>
{
    private readonly IApplicationDbContext _context;

    public GetVolunteerRecommendationsQueryHandler(IApplicationDbContext context)
        => _context = context;

    public async Task<List<VolunteerRecommendationDto>> Handle(
        GetVolunteerRecommendationsQuery request,
        CancellationToken ct)
    {
        // ── 1. Fetch the target initiative's category ────────────────────────
        var initiative = await _context.Initiatives
            .AsNoTracking()
            .Select(i => new { i.Id, i.Category })
            .FirstOrDefaultAsync(i => i.Id == request.InitiativeId, ct)
            ?? throw new KeyNotFoundException($"Initiative {request.InitiativeId} not found.");

        // ── 2. All confirmed volunteers ──────────────────────────────────────
        var volunteers = await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Volunteer && u.IsVolunteerConfirmed)
            .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email })
            .ToListAsync(ct);

        if (volunteers.Count == 0)
            return [];

        var volunteerIds = volunteers.Select(v => v.Id).ToList();

        // ── 3. Category application counts ───────────────────────────────────
        var targetCategory = initiative.Category;
        var categoryAppCounts = await _context.ApplicationRequests
            .AsNoTracking()
            .Where(a => volunteerIds.Contains(a.UserId)
                     && a.Status == ApplicationStatus.Approved
                     && a.Initiative.Category == targetCategory)
            .GroupBy(a => a.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, ct);

        // ── 4. Total approved application counts ─────────────────────────────
        var totalAppCounts = await _context.ApplicationRequests
            .AsNoTracking()
            .Where(a => volunteerIds.Contains(a.UserId)
                     && a.Status == ApplicationStatus.Approved)
            .GroupBy(a => a.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, ct);

        // ── 5. Active task counts (Accepted | InProgress) ────────────────────
        var activeTaskCounts = await _context.Tasks
            .AsNoTracking()
            .Where(t => t.AssignedVolunteerId != null
                     && volunteerIds.Contains(t.AssignedVolunteerId!)
                     && (t.Status == VolunteerTaskStatus.Accepted
                      || t.Status == VolunteerTaskStatus.InProgress))
            .GroupBy(t => t.AssignedVolunteerId!)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, ct);

        // ── 6. Completed task counts (Completed | Verified) ──────────────────
        var completedTaskCounts = await _context.Tasks
            .AsNoTracking()
            .Where(t => t.AssignedVolunteerId != null
                     && volunteerIds.Contains(t.AssignedVolunteerId!)
                     && (t.Status == VolunteerTaskStatus.Completed
                      || t.Status == VolunteerTaskStatus.Verified))
            .GroupBy(t => t.AssignedVolunteerId!)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, ct);

        // ── 7. Score each volunteer ──────────────────────────────────────────
        var recommendations = volunteers
            .Select(v =>
            {
                var categoryApps  = categoryAppCounts.GetValueOrDefault(v.Id, 0);
                var totalApps     = totalAppCounts.GetValueOrDefault(v.Id, 0);
                var activeTasks   = activeTaskCounts.GetValueOrDefault(v.Id, 0);
                var completedTasks = completedTaskCounts.GetValueOrDefault(v.Id, 0);
                var totalTasks    = activeTasks + completedTasks;

                // Component scores (each 0–100)
                // Category affinity: up to 10 matching applications, linear scale
                var categoryAffinityScore = Math.Min(categoryApps, 10) / 10.0 * 100.0;

                // Completion rate: ratio of completed to total tasks (default 50 if none)
                var completionRate = totalTasks > 0
                    ? (double)completedTasks / totalTasks
                    : 0.5;
                var completionRateScore = completionRate * 100.0;

                // Availability: penalise by active tasks (5+ active tasks → 0 score)
                var availabilityScore = Math.Max(0.0, 1.0 - activeTasks / 5.0) * 100.0;

                // Overall activity: approved applications, capped at 20
                var activityScore = Math.Min(totalApps, 20) / 20.0 * 100.0;

                // Weighted composite (weights sum to 100)
                const double wCategory    = 0.40;
                const double wCompletion  = 0.30;
                const double wAvailability = 0.20;
                const double wActivity    = 0.10;

                var composite =
                    categoryAffinityScore  * wCategory    +
                    completionRateScore    * wCompletion  +
                    availabilityScore      * wAvailability +
                    activityScore          * wActivity;

                return new VolunteerRecommendationDto
                {
                    VolunteerId           = v.Id,
                    FullName              = $"{v.FirstName} {v.LastName}",
                    Email                 = v.Email ?? string.Empty,
                    CategoryApplications  = categoryApps,
                    TotalApplications     = totalApps,
                    ActiveTasks           = activeTasks,
                    CompletedTasks        = completedTasks,
                    CategoryAffinityScore = Math.Round(categoryAffinityScore, 1),
                    CompletionRateScore   = Math.Round(completionRateScore, 1),
                    AvailabilityScore     = Math.Round(availabilityScore, 1),
                    ActivityScore         = Math.Round(activityScore, 1),
                    RecommendationScore   = Math.Round(composite, 1)
                };
            })
            .OrderByDescending(r => r.RecommendationScore)
            .Take(request.TopN)
            .ToList();

        return recommendations;
    }
}
