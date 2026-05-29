using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Application.Notifications.Queries;

public class GetMyNotificationsQueryHandler
    : IRequestHandler<GetMyNotificationsQuery, GetMyNotificationsResult>
{
    private readonly IApplicationDbContext _context;

    public GetMyNotificationsQueryHandler(IApplicationDbContext context)
        => _context = context;

    public async Task<GetMyNotificationsResult> Handle(
        GetMyNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        // Return notifications targeted at this user OR broadcast (UserId == null)
        var baseQuery = _context.Notifications
            .Where(n => n.UserId == request.UserId || n.UserId == null)
            .OrderByDescending(n => n.CreatedAt);

        var unreadCount = await baseQuery
            .CountAsync(n => !n.IsRead, cancellationToken);

        var items = await baseQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize + 1)           // +1 to detect HasMore
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type.ToString(),
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead,
                RelatedEntityId = n.RelatedEntityId,
                RelatedEntityType = n.RelatedEntityType,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var hasMore = items.Count > request.PageSize;
        if (hasMore) items.RemoveAt(items.Count - 1);

        return new GetMyNotificationsResult
        {
            Items = items,
            UnreadCount = unreadCount,
            HasMore = hasMore
        };
    }
}
