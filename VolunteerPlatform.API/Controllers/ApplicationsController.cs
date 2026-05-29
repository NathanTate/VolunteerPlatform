using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerPlatform.Application.Applications.Commands.SubmitApplication;
using VolunteerPlatform.Application.Applications.Commands.UpdateApplicationStatus;
using VolunteerPlatform.Application.Applications.Queries;
using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.API.Controllers;

[Authorize]
public class ApplicationsController : BaseAPIController
{
    private readonly IMediator _mediator;

    public ApplicationsController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Submit([FromBody] SubmitApplicationRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var id = await _mediator.Send(new SubmitApplicationCommand
        {
            InitiativeId = request.InitiativeId,
            UserId = userId,
            Comment = request.Comment
        });
        return Ok(ApiResponse<Guid>.Ok(id));
    }

    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<List<ApplicationDto>>>> GetMine()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediator.Send(new GetMyApplicationsQuery(userId));
        return Ok(ApiResponse<List<ApplicationDto>>.Ok(result));
    }

    [HttpGet]
    [Authorize(Policy = "RequireCoordinator")]
    public async Task<ActionResult<ApiResponse<List<ApplicationDto>>>> GetAll()
    {
        var result = await _mediator.Send(new GetAllApplicationsQuery());
        return Ok(ApiResponse<List<ApplicationDto>>.Ok(result));
    }

    [HttpGet("initiative/{initiativeId:guid}")]
    [Authorize(Policy = "RequireCoordinator")]
    public async Task<ActionResult<ApiResponse<List<ApplicationDto>>>> GetForInitiative(Guid initiativeId)
    {
        var result = await _mediator.Send(new GetInitiativeApplicationsQuery(initiativeId));
        return Ok(ApiResponse<List<ApplicationDto>>.Ok(result));
    }

    [HttpPut("{id:guid}/approve")]
    [Authorize(Policy = "RequireCoordinator")]
    public async Task<ActionResult<ApiResponse<object>>> Approve(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var userRole = User.FindFirstValue(System.Security.Claims.ClaimTypes.Role) ?? User.FindFirstValue("role") ?? "";
        var isAdmin = userRole is "OrganizationAdmin" or "SuperAdmin" or "Coordinator";
        await _mediator.Send(new UpdateApplicationStatusCommand
        {
            ApplicationId = id,
            Status = ApplicationStatus.Approved,
            RequestingUserId = userId,
            IsAdmin = isAdmin
        });
        return Ok(ApiResponse<object>.Ok(null!));
    }

    [HttpPut("{id:guid}/reject")]
    [Authorize(Policy = "RequireCoordinator")]
    public async Task<ActionResult<ApiResponse<object>>> Reject(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var userRole = User.FindFirstValue(System.Security.Claims.ClaimTypes.Role) ?? User.FindFirstValue("role") ?? "";
        var isAdmin = userRole is "OrganizationAdmin" or "SuperAdmin" or "Coordinator";
        await _mediator.Send(new UpdateApplicationStatusCommand
        {
            ApplicationId = id,
            Status = ApplicationStatus.Rejected,
            RequestingUserId = userId,
            IsAdmin = isAdmin
        });
        return Ok(ApiResponse<object>.Ok(null!));
    }
}

public record SubmitApplicationRequest(Guid InitiativeId, string? Comment);
