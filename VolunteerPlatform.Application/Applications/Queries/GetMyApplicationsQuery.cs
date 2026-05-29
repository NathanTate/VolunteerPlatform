using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Application.Applications.Queries;

public record GetMyApplicationsQuery(string UserId) : IRequest<List<ApplicationDto>>;

public class GetMyApplicationsQueryHandler : IRequestHandler<GetMyApplicationsQuery, List<ApplicationDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMyApplicationsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<ApplicationDto>> Handle(GetMyApplicationsQuery request, CancellationToken ct)
    {
        return await _context.ApplicationRequests
            .AsNoTracking()
            .Include(a => a.Initiative)
            .Include(a => a.User)
            .Where(a => a.UserId == request.UserId)
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
