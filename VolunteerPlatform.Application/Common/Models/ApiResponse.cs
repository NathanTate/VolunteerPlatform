namespace VolunteerPlatform.Application.Common.Models;

public class ApiResponse
{
    public bool Success { get; set; }
    public object? Data { get; set; }
    public string? Message { get; set; }
    public IDictionary<string, string[]>? Errors { get; set; }
    public int StatusCode { get; set; } = 200;

    public static ApiResponse Ok(object? data = null, string? message = null, int statusCode = 200) =>
        new() { Success = true, Data = data, Message = message, StatusCode = statusCode };

    public static ApiResponse Fail(string message, IDictionary<string, string[]>? errors = null, int statusCode = 400) =>
        new() { Success = false, Message = message, Errors = errors, StatusCode = statusCode };
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public IDictionary<string, string[]>? Errors { get; set; }
    public int StatusCode { get; set; } = 200;

    public static ApiResponse<T> Ok(T data, string? message = null, int statusCode = 200) =>
        new() { Success = true, Data = data, Message = message, StatusCode = statusCode };

    public static ApiResponse<T> Fail(string message, IDictionary<string, string[]>? errors = null, int statusCode = 400) =>
        new() { Success = false, Message = message, Errors = errors, StatusCode = statusCode };
}
