using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Application.Tasks.Queries;

namespace VolunteerPlatform.Application.Tasks.Queries.GetTasksForInitiative;

public class GetTasksForInitiativeQueryHandler : IRequestHandler<GetTasksForInitiativeQuery, List<TaskSummaryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetTasksForInitiativeQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<TaskSummaryDto>> Handle(GetTasksForInitiativeQuery request, CancellationToken ct)
    {
        var query = _context.Tasks
            .AsNoTracking()
            .Include(t => t.AssignedVolunteer)
            .Where(t => t.InitiativeId == request.InitiativeId);

        if (request.Status.HasValue)
            query = query.Where(t => t.Status == request.Status.Value);

        if (!string.IsNullOrEmpty(request.AssignedVolunteerId))
            query = query.Where(t => t.AssignedVolunteerId == request.AssignedVolunteerId);

        return await query
            .OrderBy(t => t.Priority)
            .ThenBy(t => t.Deadline)
            .Select(t => new TaskSummaryDto
            {
                Id = t.Id,
                Title = t.Title,
                Priority = t.Priority.ToString(),
                Status = t.Status.ToString(),
                AssignedVolunteerName = t.AssignedVolunteer != null
                    ? t.AssignedVolunteer.FirstName + " " + t.AssignedVolunteer.LastName
                    : null,
                Deadline = t.Deadline
            })
            .ToListAsync(ct);
    }
}
