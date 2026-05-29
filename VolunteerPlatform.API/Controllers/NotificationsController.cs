using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Application.Notifications;
using VolunteerPlatform.Application.Notifications.Commands;
using VolunteerPlatform.Application.Notifications.Queries;

namespace VolunteerPlatform.API.Controllers;

[Authorize]
public class NotificationsController : BaseAPIController
{
    private readonly IMediator _mediator;
    public NotificationsController(IMediator mediator) => _mediator = mediator;

    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException();

    /// <summary>Returns the current user's notifications (targeted + broadcast), newest first.</summary>
    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<GetMyNotificationsResult>>> GetMy(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(
            new GetMyNotificationsQuery(CurrentUserId, page, pageSize),
            cancellationToken);
        return Ok(ApiResponse<GetMyNotificationsResult>.Ok(result));
    }

    /// <summary>Marks a single notification as read.</summary>
    [HttpPost("{id:guid}/read")]
    public async Task<ActionResult<ApiResponse>> MarkRead(Guid id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new MarkNotificationReadCommand(id, CurrentUserId), cancellationToken);
        return Ok(ApiResponse.Ok());
    }

    /// <summary>Marks all of the current user's notifications as read.</summary>
    [HttpPost("read-all")]
    public async Task<ActionResult<ApiResponse>> MarkAllRead(CancellationToken cancellationToken)
    {
        await _mediator.Send(new MarkAllNotificationsReadCommand(CurrentUserId), cancellationToken);
        return Ok(ApiResponse.Ok());
    }
}
