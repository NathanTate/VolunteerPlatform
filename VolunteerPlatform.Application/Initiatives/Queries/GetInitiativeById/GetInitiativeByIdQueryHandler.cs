using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Application.Initiatives.Queries.GetInitiatives;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Initiatives.Queries.GetInitiativeById;

public class GetInitiativeByIdQueryHandler : IRequestHandler<GetInitiativeByIdQuery, InitiativeDto?>
{
    private readonly IApplicationDbContext _context;

    public GetInitiativeByIdQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<InitiativeDto?> Handle(GetInitiativeByIdQuery request, CancellationToken ct)
    {
        return await _context.Initiatives
            .AsNoTracking()
            .Include(i => i.Organizer)
            .Include(i => i.Applications)
            .Include(i => i.Images)
            .Include(i => i.Tasks)
            .Where(i => i.Id == request.Id)
            .Select(i => new InitiativeDto
            {
                Id = i.Id,
                Title = i.Title,
                Description = i.Description,
                Category = i.Category.ToString(),
                UrgencyLevel = i.UrgencyLevel.ToString(),
                Status = i.Status.ToString(),
                StartDate = i.StartDate,
                EndDate = i.EndDate,
                Latitude = i.Latitude,
                Longitude = i.Longitude,
                Address = i.Address,
                RadiusKm = i.RadiusKm,
                RequiredVolunteers = i.RequiredVolunteers,
                MaxParticipants = i.MaxParticipants,
                CurrentParticipants = i.Applications.Count(a => a.Status == ApplicationStatus.Approved),
                IsEmergency = i.IsEmergency,
                OrganizerId = i.OrganizerId,
                OrganizerName = i.Organizer.FirstName + " " + i.Organizer.LastName,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt,
                ImageUrls = i.Images.OrderByDescending(img => img.IsCover).Select(img => img.Url).ToList(),
                TasksTotal = i.Tasks.Count(t => !t.IsDeleted),
                TasksCompleted = i.Tasks.Count(t => !t.IsDeleted &&
                    (t.Status == VolunteerTaskStatus.Completed || t.Status == VolunteerTaskStatus.Verified))
            })
            .FirstOrDefaultAsync(ct);
    }
}
