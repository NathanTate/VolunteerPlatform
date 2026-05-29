using MediatR;

namespace VolunteerPlatform.Application.Volunteers.Queries.GetVolunteerRecommendations;

public record GetVolunteerRecommendationsQuery(
    Guid InitiativeId,
    int TopN = 10
) : IRequest<List<VolunteerRecommendationDto>>;
