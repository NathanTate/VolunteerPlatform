using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using VolunteerPlatform.Application.Common.Exceptions;

namespace VolunteerPlatform.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/problem+json";

        var (status, problem) = ex switch
        {
            ValidationException ve => ((int)HttpStatusCode.BadRequest, new ProblemDetails
            {
                Status = (int)HttpStatusCode.BadRequest,
                Title = "Validation Error",
                Detail = string.Join("; ", ve.Errors.Select(e => e.ErrorMessage))
            }),
            ValidationFailureException vf => ((int)HttpStatusCode.BadRequest, new ProblemDetails
            {
                Status = (int)HttpStatusCode.BadRequest,
                Title = "Validation Error",
                Detail = string.Join("; ", vf.Errors.SelectMany(kvp => kvp.Value))
            }),
            NotFoundException => ((int)HttpStatusCode.NotFound, new ProblemDetails
            {
                Status = (int)HttpStatusCode.NotFound,
                Title = "Not Found",
                Detail = ex.Message
            }),
            ForbiddenAccessException => ((int)HttpStatusCode.Forbidden, new ProblemDetails
            {
                Status = (int)HttpStatusCode.Forbidden,
                Title = "Forbidden",
                Detail = ex.Message
            }),
            global::System.UnauthorizedAccessException => ((int)HttpStatusCode.Unauthorized, new ProblemDetails
            {
                Status = (int)HttpStatusCode.Unauthorized,
                Title = "Unauthorized",
                Detail = ex.Message
            }),
            InvalidOperationException => ((int)HttpStatusCode.Conflict, new ProblemDetails
            {
                Status = (int)HttpStatusCode.Conflict,
                Title = "Conflict",
                Detail = ex.Message
            }),
            _ => ((int)HttpStatusCode.InternalServerError, new ProblemDetails
            {
                Status = (int)HttpStatusCode.InternalServerError,
                Title = "Internal Server Error",
                Detail = "An unexpected error occurred."
            })
        };

        context.Response.StatusCode = status;
        await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
    }
}
