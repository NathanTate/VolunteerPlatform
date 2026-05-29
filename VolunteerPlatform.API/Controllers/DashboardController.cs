using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Application.Dashboard.Queries.GetDashboardStats;

namespace VolunteerPlatform.API.Controllers;

/// <summary>Aggregated platform statistics for the real-time dashboard.</summary>
public class DashboardController : BaseAPIController
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator) => _mediator = mediator;

    /// <summary>Returns current platform-wide statistics (initiatives, tasks, volunteers).</summary>
    [HttpGet("stats")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetStats(
        CancellationToken cancellationToken)
    {
        var stats = await _mediator.Send(new GetDashboardStatsQuery(), cancellationToken);
        return Ok(new ApiResponse<DashboardStatsDto> { Data = stats, Success = true });
    }
}
