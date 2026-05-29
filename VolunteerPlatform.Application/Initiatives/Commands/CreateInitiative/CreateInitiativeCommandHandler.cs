using MediatR;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Entities;

namespace VolunteerPlatform.Application.Initiatives.Commands.CreateInitiative;

public class CreateInitiativeCommandHandler : IRequestHandler<CreateInitiativeCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notifications;

    public CreateInitiativeCommandHandler(IApplicationDbContext context, INotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task<Guid> Handle(CreateInitiativeCommand request, CancellationToken ct)
    {
        var initiative = new Initiative
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            UrgencyLevel = request.UrgencyLevel,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Address = request.Address,
            RadiusKm = request.RadiusKm,
            RequiredVolunteers = request.RequiredVolunteers,
            MaxParticipants = request.MaxParticipants,
            IsEmergency = request.IsEmergency,
            OrganizerId = request.OrganizerId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        foreach (var (url, idx) in request.ImageUrls.Select((u, i) => (u, i)))
        {
            initiative.Images.Add(new InitiativeImage
            {
                Id = Guid.NewGuid(),
                InitiativeId = initiative.Id,
                Url = url,
                IsCover = idx == 0,
                UploadedAt = DateTime.UtcNow
            });
        }

        _context.Initiatives.Add(initiative);
        await _context.SaveChangesAsync(ct);

        await _notifications.NotifyNewInitiativeNearby(initiative.Id, initiative.Title);
        await _notifications.NotifyDashboardUpdated();

        if (request.IsEmergency)
            await _notifications.NotifyEmergencyInitiative(initiative.Id, initiative.Title);

        return initiative.Id;
    }
}
