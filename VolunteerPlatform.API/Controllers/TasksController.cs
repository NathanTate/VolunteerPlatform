using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Application.Tasks.Commands.AddTaskComment;
using VolunteerPlatform.Application.Tasks.Commands.AssignTask;
using VolunteerPlatform.Application.Tasks.Commands.CreateTask;
using VolunteerPlatform.Application.Tasks.Commands.UpdateTaskStatus;
using VolunteerPlatform.Application.Tasks.Queries;
using VolunteerPlatform.Application.Tasks.Queries.GetMyTasks;
using VolunteerPlatform.Application.Tasks.Queries.GetTaskById;
using VolunteerPlatform.Application.Tasks.Queries.GetTasksForInitiative;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.API.Controllers;

[Authorize]
public class TasksController : BaseAPIController
{
    private readonly IMediator _mediator;

    public TasksController(IMediator mediator) => _mediator = mediator;

    /// <summary>Get all tasks for a specific initiative.</summary>
    [HttpGet("initiatives/{initiativeId:guid}/tasks")]
    public async Task<ActionResult<ApiResponse<List<TaskSummaryDto>>>> GetForInitiative(
        Guid initiativeId,
        [FromQuery] VolunteerTaskStatus? status = null,
        [FromQuery] string? assignedVolunteerId = null)
    {
        var result = await _mediator.Send(new GetTasksForInitiativeQuery
        {
            InitiativeId = initiativeId,
            Status = status,
            AssignedVolunteerId = assignedVolunteerId
        });
        return Ok(ApiResponse<List<TaskSummaryDto>>.Ok(result));
    }

    /// <summary>Get tasks assigned to the current user.</summary>
    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<List<TaskSummaryDto>>>> GetMyTasks(
        [FromQuery] VolunteerTaskStatus? status = null)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediator.Send(new GetMyTasksQuery(userId, status));
        return Ok(ApiResponse<List<TaskSummaryDto>>.Ok(result));
    }

    /// <summary>Get full task details including comments, history, and attachments.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<TaskDto>>> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetTaskByIdQuery(id));
        if (result == null) return NotFound(ApiResponse<TaskDto>.Fail("Task not found."));
        return Ok(ApiResponse<TaskDto>.Ok(result));
    }

    /// <summary>Create a new task inside an initiative (Coordinator or above).</summary>
    [HttpPost]
    [Authorize(Policy = "RequireCoordinator")]
    public async Task<ActionResult<ApiResponse<Guid>>> Create([FromBody] CreateTaskRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var id = await _mediator.Send(new CreateTaskCommand
        {
            InitiativeId = request.InitiativeId,
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            Deadline = request.Deadline,
            CreatedById = userId
        });
        return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<Guid>.Ok(id));
    }

    /// <summary>Assign a volunteer to a task.</summary>
    [HttpPost("{id:guid}/assign")]
    [Authorize(Policy = "RequireCoordinator")]
    public async Task<ActionResult<ApiResponse<object>>> Assign(Guid id, [FromBody] AssignTaskRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await _mediator.Send(new AssignTaskCommand(id, request.VolunteerId, userId));
        return Ok(ApiResponse<object>.Ok(null!));
    }

    /// <summary>Update task status (volunteer or coordinator depending on transition).</summary>
    [HttpPost("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateStatus(Guid id, [FromBody] UpdateTaskStatusRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role") ?? "";
        var isAdmin  = userRole is "OrganizationAdmin" or "SuperAdmin" or "Coordinator";
        await _mediator.Send(new UpdateTaskStatusCommand
        {
            TaskId = id,
            NewStatus = request.NewStatus,
            RequestingUserId = userId,
            IsAdmin = isAdmin,
            Note = request.Note,
            CompletionProofUrl = request.CompletionProofUrl
        });
        return Ok(ApiResponse<object>.Ok(null!));
    }

    /// <summary>Add a comment to a task.</summary>
    [HttpPost("{id:guid}/comments")]
    public async Task<ActionResult<ApiResponse<Guid>>> AddComment(Guid id, [FromBody] AddCommentRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var commentId = await _mediator.Send(new AddTaskCommentCommand(id, userId, request.Text));
        return Ok(ApiResponse<Guid>.Ok(commentId));
    }
}

public record CreateTaskRequest(
    Guid InitiativeId,
    string Title,
    string Description,
    TaskPriority Priority,
    DateTime? Deadline);

public record AssignTaskRequest(string VolunteerId);

public record UpdateTaskStatusRequest(
    VolunteerTaskStatus NewStatus,
    string? Note,
    string? CompletionProofUrl);

public record AddCommentRequest(string Text);
