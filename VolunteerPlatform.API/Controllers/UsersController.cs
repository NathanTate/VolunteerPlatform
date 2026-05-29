using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Application.Users.Commands;
using VolunteerPlatform.Application.Users.Queries;
using VolunteerPlatform.Domain.Entities;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.API.Controllers;

[Authorize]
public class UsersController : BaseAPIController
{
    private readonly IMediator _mediator;
    private readonly UserManager<User> _userManager;

    public UsersController(IMediator mediator, UserManager<User> userManager)
    {
        _mediator = mediator;
        _userManager = userManager;
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetMe()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        return Ok(ApiResponse<UserDto>.Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            IsVolunteerConfirmed = user.IsVolunteerConfirmed,
            IsOrganizationApproved = user.IsOrganizationApproved,
            OrganizationName = user.OrganizationName,
            CreatedAt = user.CreatedAt
        }));
    }

    [HttpPut("me")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateMe([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        await _userManager.UpdateAsync(user);

        return Ok(ApiResponse<object>.Ok(null!));
    }

    [HttpGet]
    [Authorize(Policy = "RequireOrganizationAdmin")]
    public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetAll()
    {
        var result = await _mediator.Send(new GetUsersQuery());
        return Ok(ApiResponse<List<UserDto>>.Ok(result));
    }

    [HttpPut("{id}/role")]
    [Authorize(Policy = "RequireOrganizationAdmin")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateRole(string id, [FromBody] UpdateRoleRequest request)
    {
        await _mediator.Send(new UpdateUserRoleCommand(id, request.Role));
        return Ok(ApiResponse<object>.Ok(null!));
    }

    [HttpPut("{id}/confirm-volunteer")]
    [Authorize(Policy = "RequireCoordinator")]
    public async Task<ActionResult<ApiResponse<object>>> ConfirmVolunteer(string id, [FromBody] ConfirmVolunteerRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(ApiResponse<object>.Fail("User not found."));
        user.IsVolunteerConfirmed = request.Confirmed;
        await _userManager.UpdateAsync(user);
        return Ok(ApiResponse<object>.Ok(null!));
    }

    [HttpPut("{id}/approve-organization")]
    [Authorize(Policy = "RequireOrganizationAdmin")]
    public async Task<ActionResult<ApiResponse<object>>> ApproveOrganization(string id, [FromBody] ApproveOrgRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(ApiResponse<object>.Fail("User not found."));
        user.IsOrganizationApproved = request.Approved;
        await _userManager.UpdateAsync(user);
        return Ok(ApiResponse<object>.Ok(null!));
    }

    [HttpPut("{id}/organization-name")]
    [Authorize(Policy = "RequireOrganizationAdmin")]
    public async Task<ActionResult<ApiResponse<object>>> SetOrganizationName(string id, [FromBody] SetOrgNameRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(ApiResponse<object>.Fail("User not found."));
        user.OrganizationName = request.OrganizationName?.Trim();
        await _userManager.UpdateAsync(user);
        return Ok(ApiResponse<object>.Ok(null!));
    }


    /// <summary>Count of pending role applications — for admin badge.</summary>
    [HttpGet("pending-count")]
    [Authorize(Policy = "RequireOrganizationAdmin")]
    public async Task<ActionResult<ApiResponse<int>>> GetPendingCount()
    {
        var pendingVolunteers = _userManager.Users
            .Where(u => u.Role == UserRole.Volunteer && !u.IsVolunteerConfirmed).Count();
        var pendingOrgs = _userManager.Users
            .Where(u => u.Role == UserRole.OrganizationAdmin && !u.IsOrganizationApproved).Count();
        return Ok(ApiResponse<int>.Ok(pendingVolunteers + pendingOrgs));
    }


    [HttpPost("me/apply-role")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> ApplyForRole([FromBody] ApplyRoleRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        if (user.Role != UserRole.Guest)
            return BadRequest(ApiResponse<object>.Fail("You already have a role assigned."));

        if (request.Role == UserRole.Volunteer)
        {
            user.Role = UserRole.Volunteer;
            user.IsVolunteerConfirmed = false;
        }
        else if (request.Role == UserRole.OrganizationAdmin)
        {
            if (string.IsNullOrWhiteSpace(request.OrganizationName))
                return BadRequest(ApiResponse<object>.Fail("Organization name is required."));
            user.Role = UserRole.OrganizationAdmin;
            user.OrganizationName = request.OrganizationName.Trim();
            user.IsOrganizationApproved = false;
        }
        else
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid role requested."));
        }

        await _userManager.UpdateAsync(user);
        return Ok(ApiResponse<object>.Ok(null!));
    }
}


public record UpdateProfileRequest(string FirstName, string LastName);
public record UpdateRoleRequest(UserRole Role);
public record ConfirmVolunteerRequest(bool Confirmed);
public record ApproveOrgRequest(bool Approved);
public record SetOrgNameRequest(string? OrganizationName);
public record ApplyRoleRequest(UserRole Role, string? OrganizationName);