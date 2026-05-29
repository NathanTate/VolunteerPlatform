using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Application.Tasks.Queries;

namespace VolunteerPlatform.Application.Tasks.Queries.GetMyTasks;

public class GetMyTasksQueryHandler : IRequestHandler<GetMyTasksQuery, List<TaskSummaryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMyTasksQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<TaskSummaryDto>> Handle(GetMyTasksQuery request, CancellationToken ct)
    {
        var query = _context.Tasks
            .AsNoTracking()
            .Include(t => t.AssignedVolunteer)
            .Where(t => t.AssignedVolunteerId == request.VolunteerId);

        if (request.Status.HasValue)
            query = query.Where(t => t.Status == request.Status.Value);

        return await query
            .OrderBy(t => t.Deadline)
            .ThenByDescending(t => t.Priority)
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
