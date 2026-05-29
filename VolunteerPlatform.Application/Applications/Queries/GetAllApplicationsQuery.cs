using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Application.Applications.Queries;

public record GetAllApplicationsQuery : IRequest<List<ApplicationDto>>;

public class GetAllApplicationsQueryHandler : IRequestHandler<GetAllApplicationsQuery, List<ApplicationDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAllApplicationsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<ApplicationDto>> Handle(GetAllApplicationsQuery request, CancellationToken ct)
    {
        return await _context.ApplicationRequests
            .AsNoTracking()
            .Include(a => a.Initiative)
            .Include(a => a.User)
            .OrderByDescending(a => a.SubmittedAt)
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
