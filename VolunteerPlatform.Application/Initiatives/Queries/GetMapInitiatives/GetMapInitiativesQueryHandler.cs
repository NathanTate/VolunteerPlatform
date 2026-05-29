using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Application.Initiatives.Queries.GetMapInitiatives;

public class GetMapInitiativesQueryHandler : IRequestHandler<GetMapInitiativesQuery, List<InitiativeMapDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMapInitiativesQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<InitiativeMapDto>> Handle(GetMapInitiativesQuery request, CancellationToken ct)
    {
        return await _context.Initiatives
            .AsNoTracking()
            .Include(i => i.Images)
            .Select(i => new InitiativeMapDto
            {
                Id = i.Id,
                Title = i.Title,
                Category = i.Category.ToString(),
                Status = i.Status.ToString(),
                UrgencyLevel = i.UrgencyLevel.ToString(),
                IsEmergency = i.IsEmergency,
                Latitude = i.Latitude,
                Longitude = i.Longitude,
                RadiusKm = i.RadiusKm,
                CoverImageUrl = i.Images.Where(img => img.IsCover).Select(img => img.Url).FirstOrDefault()
            })
            .ToListAsync(ct);
    }
}
