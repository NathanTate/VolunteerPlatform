using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Application.Initiatives.Commands.ArchiveInitiative;
using VolunteerPlatform.Application.Initiatives.Commands.CreateInitiative;
using VolunteerPlatform.Application.Initiatives.Commands.DeleteInitiative;
using VolunteerPlatform.Application.Initiatives.Commands.UpdateInitiative;
using VolunteerPlatform.Application.Initiatives.Queries.GetInitiativeById;
using VolunteerPlatform.Application.Initiatives.Queries.GetInitiatives;
using VolunteerPlatform.Application.Initiatives.Queries.GetMapInitiatives;
using VolunteerPlatform.Application.Initiatives.Queries.GetNearbyInitiatives;
using VolunteerPlatform.Application.Initiatives.Commands.TriggerEmergencyAlert;
using VolunteerPlatform.Application.Volunteers.Queries.GetVolunteerRecommendations;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.API.Controllers;

public class InitiativesController : BaseAPIController
{
    private readonly IMediator _mediator;
    private readonly INotificationService _notificationService;

    public InitiativesController(IMediator mediator, INotificationService notificationService)
    {
        _mediator = mediator;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedList<InitiativeDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] InitiativeCategory? category = null,
        [FromQuery] InitiativeStatus? status = null,
        [FromQuery] UrgencyLevel? urgencyLevel = null,
        [FromQuery] bool? isEmergency = null,
        [FromQuery] string? search = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] double? lat = null,
        [FromQuery] double? lng = null,
        [FromQuery] double? radiusKm = null)
    {
        var result = await _mediator.Send(new GetInitiativesQuery
        {
            Page = page, PageSize = pageSize, Category = category, Status = status,
            UrgencyLevel = urgencyLevel, IsEmergency = isEmergency,
            Search = search, DateFrom = dateFrom, DateTo = dateTo,
            SortBy = sortBy, Lat = lat, Lng = lng, RadiusKm = radiusKm
        });
        return Ok(ApiResponse<PaginatedList<InitiativeDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<InitiativeDto>>> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetInitiativeByIdQuery(id));
        if (result == null) return NotFound(ApiResponse<InitiativeDto>.Fail("Initiative not found."));
        return Ok(ApiResponse<InitiativeDto>.Ok(result));
    }

    [HttpGet("map")]
    public async Task<ActionResult<ApiResponse<List<InitiativeMapDto>>>> GetMap()
    {
        var result = await _mediator.Send(new GetMapInitiativesQuery());
        return Ok(ApiResponse<List<InitiativeMapDto>>.Ok(result));
    }

    [HttpGet("nearby")]
    public async Task<ActionResult<ApiResponse<List<InitiativeMapDto>>>> GetNearby(
        [FromQuery] double lat, [FromQuery] double lng, [FromQuery] double radiusKm = 10)
    {
        var result = await _mediator.Send(new GetNearbyInitiativesQuery { Lat = lat, Lng = lng, RadiusKm = radiusKm });
        return Ok(ApiResponse<List<InitiativeMapDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "RequireVolunteer")]
    public async Task<ActionResult<ApiResponse<Guid>>> Create([FromBody] CreateInitiativeRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var id = await _mediator.Send(new CreateInitiativeCommand
        {
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
            ImageUrls = request.ImageUrls ?? new List<string>(),
            OrganizerId = userId
        });
        return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireVolunteer")]
    public async Task<ActionResult<ApiResponse<object>>> Update(Guid id, [FromBody] UpdateInitiativeRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var userRole = User.FindFirstValue(System.Security.Claims.ClaimTypes.Role) ?? User.FindFirstValue("role") ?? "";
        var isAdmin = userRole is "OrganizationAdmin" or "SuperAdmin" or "Coordinator";
        await _mediator.Send(new UpdateInitiativeCommand
        {
            Id = id,
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            UrgencyLevel = request.UrgencyLevel,
            Status = request.Status,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Address = request.Address,
            RadiusKm = request.RadiusKm,
            RequiredVolunteers = request.RequiredVolunteers,
            MaxParticipants = request.MaxParticipants,
            IsEmergency = request.IsEmergency,
            RequestingUserId = userId,
            IsAdmin = isAdmin
        });
        return Ok(ApiResponse<object>.Ok(null!));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireVolunteer")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
    {
        await _mediator.Send(new DeleteInitiativeCommand(id));
        return Ok(ApiResponse<object>.Ok(null!));
    }

    [HttpPost("{id:guid}/archive")]
    [Authorize(Policy = "RequireVolunteer")]
    public async Task<ActionResult<ApiResponse<object>>> Archive(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var userRole = User.FindFirstValue(System.Security.Claims.ClaimTypes.Role) ?? User.FindFirstValue("role") ?? "";
        var isAdmin = userRole is "OrganizationAdmin" or "SuperAdmin" or "Coordinator";
        await _mediator.Send(new ArchiveInitiativeCommand(id, userId, isAdmin));
        return Ok(ApiResponse<object>.Ok(null!));
    }

    [HttpPost("{id:guid}/emergency-alert")]
    [Authorize(Policy = "RequireCoordinator")]
    public async Task<ActionResult<ApiResponse<int>>> TriggerEmergencyAlert(
        Guid id, [FromBody] TriggerEmergencyAlertRequest request)
    {
        var userId  = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var userRole = User.FindFirstValue(System.Security.Claims.ClaimTypes.Role) ?? User.FindFirstValue("role") ?? "";
        var isAdmin = userRole is "OrganizationAdmin" or "SuperAdmin" or "Coordinator";
        var count   = await _mediator.Send(
            new TriggerEmergencyAlertCommand(id, userId, isAdmin, request.CustomMessage));
        return Ok(ApiResponse<int>.Ok(count));
    }

    [HttpPost("{id:guid}/invite-volunteer/{volunteerId}")]
    [Authorize(Policy = "RequireCoordinator")]
    public async Task<ActionResult<ApiResponse<object>>> InviteVolunteer(Guid id, string volunteerId)
    {
        var initiative = await _mediator.Send(new GetInitiativeByIdQuery(id));
        if (initiative == null) return NotFound(ApiResponse<object>.Fail("Initiative not found."));
        await _notificationService.NotifyVolunteerInvited(volunteerId, id, initiative.Title);
        return Ok(ApiResponse<object>.Ok(null!));
    }

    [HttpGet("{id:guid}/recommended-volunteers")]
    [Authorize(Policy = "RequireCoordinator")]
    public async Task<ActionResult<ApiResponse<List<VolunteerRecommendationDto>>>> GetRecommendedVolunteers(
        Guid id, [FromQuery] int topN = 10)
    {
        var result = await _mediator.Send(new GetVolunteerRecommendationsQuery(id, topN));
        return Ok(ApiResponse<List<VolunteerRecommendationDto>>.Ok(result));
    }
}

public record CreateInitiativeRequest(
    string Title,
    string Description,
    InitiativeCategory Category,
    UrgencyLevel UrgencyLevel,
    DateTime StartDate,
    DateTime? EndDate,
    double Latitude,
    double Longitude,
    string Address,
    double RadiusKm,
    int RequiredVolunteers,
    int MaxParticipants,
    bool IsEmergency,
    List<string>? ImageUrls);

public record UpdateInitiativeRequest(
    string Title,
    string Description,
    InitiativeCategory Category,
    UrgencyLevel UrgencyLevel,
    InitiativeStatus Status,
    DateTime StartDate,
    DateTime? EndDate,
    double Latitude,
    double Longitude,
    string Address,
    double RadiusKm,
    int RequiredVolunteers,
    int MaxParticipants,
    bool IsEmergency);

public record TriggerEmergencyAlertRequest(string? CustomMessage);
