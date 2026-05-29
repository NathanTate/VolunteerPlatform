using MediatR;

namespace VolunteerPlatform.Application.Notifications.Queries;

public record GetMyNotificationsQuery(
    string UserId,
    int Page = 1,
    int PageSize = 30
) : IRequest<GetMyNotificationsResult>;

public class GetMyNotificationsResult
{
    public List<NotificationDto> Items { get; set; } = [];
    public int UnreadCount { get; set; }
    public bool HasMore { get; set; }
}
