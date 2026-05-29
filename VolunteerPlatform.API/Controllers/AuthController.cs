using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Application.Users.Commands.LoginUser;
using VolunteerPlatform.Application.Users.Commands.RefreshToken;
using VolunteerPlatform.Application.Users.Commands.RegisterUser;
using VolunteerPlatform.Application.Users.Queries;

namespace VolunteerPlatform.API.Controllers;

public class AuthController : BaseAPIController
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthenticationResult>>> Register([FromBody] RegisterUserRequest request)
    {
        var result = await _mediator.Send(new RegisterUserCommand(
            request.FirstName,
            request.LastName,
            request.Email,
            request.Password,
            request.OrganizationName,
            HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
        ));

        return Ok(ApiResponse<AuthenticationResult>.Ok(result));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthenticationResult>>> Login([FromBody] LoginRequest request)
    {
        var result = await _mediator.Send(new LoginUserCommand(
            request.Email,
            request.Password,
            HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
        ));

        return Ok(ApiResponse<AuthenticationResult>.Ok(result));
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<AuthenticationResult>>> Refresh([FromBody] RefreshTokenRequest request)
    {
        var result = await _mediator.Send(new RefreshTokenCommand(
            request.RefreshToken,
            HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
        ));

        return Ok(ApiResponse<AuthenticationResult>.Ok(result));
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> Profile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<UserProfileDto>.Fail("Invalid user.", null, 401));

        var profile = await _mediator.Send(new GetUserProfileQuery(userId));
        return Ok(ApiResponse<UserProfileDto>.Ok(profile));
    }
}

public record RegisterUserRequest(string FirstName, string LastName, string Email, string Password, string? OrganizationName);
public record LoginRequest(string Email, string Password);
public record RefreshTokenRequest(string RefreshToken);
