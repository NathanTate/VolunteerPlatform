using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Application.Applications.Queries;

public record GetInitiativeApplicationsQuery(Guid InitiativeId) : IRequest<List<ApplicationDto>>;

public class GetInitiativeApplicationsQueryHandler : IRequestHandler<GetInitiativeApplicationsQuery, List<ApplicationDto>>
{
    private readonly IApplicationDbContext _context;

    public GetInitiativeApplicationsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<ApplicationDto>> Handle(GetInitiativeApplicationsQuery request, CancellationToken ct)
    {
        return await _context.ApplicationRequests
            .AsNoTracking()
            .Include(a => a.Initiative)
            .Include(a => a.User)
            .Where(a => a.InitiativeId == request.InitiativeId)
            .Select(a => new ApplicationDto
            {
                Id = a.Id,
                InitiativeId = a.InitiativeId,
                InitiativeTitle = a.Initiative.Title,
                UserId = a.UserId,
                UserName = a.User.FirstName + " " + a.User.LastName,
                Status = a.Status.ToString(),
                Comment = a.Comment,
                SubmittedAt = a.SubmittedAt
            })
            .ToListAsync(ct);
    }
}
