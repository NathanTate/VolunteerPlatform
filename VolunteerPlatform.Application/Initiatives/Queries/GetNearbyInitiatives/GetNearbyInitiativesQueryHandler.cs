using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Application.Initiatives.Queries.GetMapInitiatives;

namespace VolunteerPlatform.Application.Initiatives.Queries.GetNearbyInitiatives;

public class GetNearbyInitiativesQueryHandler : IRequestHandler<GetNearbyInitiativesQuery, List<InitiativeMapDto>>
{
    private readonly IApplicationDbContext _context;

    public GetNearbyInitiativesQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<InitiativeMapDto>> Handle(GetNearbyInitiativesQuery request, CancellationToken ct)
    {
        double latDelta = request.RadiusKm / 111.0;
        double lngDelta = request.RadiusKm / (111.0 * Math.Cos(request.Lat * Math.PI / 180));

        var candidates = await _context.Initiatives
            .AsNoTracking()
            .Include(i => i.Images)
            .Where(i => i.Latitude >= request.Lat - latDelta
                     && i.Latitude <= request.Lat + latDelta
                     && i.Longitude >= request.Lng - lngDelta
                     && i.Longitude <= request.Lng + lngDelta)
            .ToListAsync(ct);

        return candidates
            .Where(i => HaversineDistance(request.Lat, request.Lng, i.Latitude, i.Longitude) <= request.RadiusKm)
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
                CoverImageUrl = i.Images.FirstOrDefault(img => img.IsCover)?.Url,
                DistanceKm = HaversineDistance(request.Lat, request.Lng, i.Latitude, i.Longitude)
            })
            .OrderBy(i => i.DistanceKm)
            .ToList();
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
