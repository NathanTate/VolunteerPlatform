using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Initiatives.Queries.GetInitiatives;

public class GetInitiativesQueryHandler : IRequestHandler<GetInitiativesQuery, PaginatedList<InitiativeDto>>
{
    private readonly IApplicationDbContext _context;

    public GetInitiativesQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<PaginatedList<InitiativeDto>> Handle(GetInitiativesQuery request, CancellationToken ct)
    {
        var query = _context.Initiatives.AsNoTracking()
            .Include(i => i.Organizer)
            .Include(i => i.Applications)
            .Include(i => i.Images)
            .Include(i => i.Tasks)
            .AsQueryable();

        if (request.Category.HasValue)
            query = query.Where(i => i.Category == request.Category.Value);

        if (request.Status.HasValue)
            query = query.Where(i => i.Status == request.Status.Value);

        if (request.UrgencyLevel.HasValue)
            query = query.Where(i => i.UrgencyLevel == request.UrgencyLevel.Value);

        if (request.IsEmergency.HasValue)
            query = query.Where(i => i.IsEmergency == request.IsEmergency.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.ToLower();
            query = query.Where(i =>
                i.Title.ToLower().Contains(term) ||
                i.Description.ToLower().Contains(term) ||
                i.Address.ToLower().Contains(term));
        }

        if (request.DateFrom.HasValue)
            query = query.Where(i => i.StartDate >= request.DateFrom.Value);

        if (request.DateTo.HasValue)
            query = query.Where(i => i.StartDate <= request.DateTo.Value);

        // Approximate bounding-box pre-filter when radius search is requested.
        // Fine-grained Haversine is applied in-memory after paging.
        if (request.Lat.HasValue && request.Lng.HasValue && request.RadiusKm.HasValue)
        {
            double r = request.RadiusKm.Value;
            double latDelta = r / 111.0;
            double lngDelta = r / (111.0 * Math.Cos(request.Lat.Value * Math.PI / 180));
            query = query.Where(i =>
                i.Latitude >= request.Lat.Value - latDelta &&
                i.Latitude <= request.Lat.Value + latDelta &&
                i.Longitude >= request.Lng.Value - lngDelta &&
                i.Longitude <= request.Lng.Value + lngDelta);
        }

        query = request.SortBy switch
        {
            "urgency" => query.OrderByDescending(i => i.UrgencyLevel).ThenByDescending(i => i.CreatedAt),
            "date" => query.OrderByDescending(i => i.StartDate),
            "participants" => query.OrderByDescending(i => i.Applications.Count),
            _ => query.OrderByDescending(i => i.IsEmergency).ThenByDescending(i => i.CreatedAt)
        };

        var projected = query.Select(i => new InitiativeDto
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
        });

        var result = await PaginatedList<InitiativeDto>.CreateAsync(projected, request.Page, request.PageSize, ct);

        // Apply precise Haversine distance filtering + sorting after paging
        if (request.Lat.HasValue && request.Lng.HasValue)
        {
            foreach (var item in result.Items)
                item.DistanceKm = HaversineDistance(request.Lat.Value, request.Lng.Value, item.Latitude, item.Longitude);

            if (request.SortBy == "distance")
                result.Items.Sort((a, b) => (a.DistanceKm ?? double.MaxValue).CompareTo(b.DistanceKm ?? double.MaxValue));

            if (request.RadiusKm.HasValue)
                result.Items.RemoveAll(item => item.DistanceKm > request.RadiusKm.Value);
        }

        return result;
    }

    private static double HaversineDistance(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371;
        double dLat = (lat2 - lat1) * Math.PI / 180;
        double dLng = (lng2 - lng1) * Math.PI / 180;
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                 + Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180)
                 * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
