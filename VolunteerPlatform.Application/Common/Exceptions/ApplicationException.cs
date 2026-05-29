namespace VolunteerPlatform.Application.Common.Exceptions;

public class ApplicationException : Exception
{
    public ApplicationException(string message) : base(message) { }
    public ApplicationException(string message, Exception innerException) : base(message, innerException) { }
}

public class NotFoundException : ApplicationException
{
    public NotFoundException(string resource, object key) : base($"{resource} with key '{key}' not found.") { }
}

public class ValidationFailureException : ApplicationException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationFailureException(IDictionary<string, string[]> errors)
        : base("One or more validation failures have occurred.")
    {
        Errors = errors;
    }
}

public class UnauthorizedAccessException : ApplicationException
{
    public UnauthorizedAccessException(string message) : base(message) { }
}

public class ForbiddenAccessException : ApplicationException
{
    public ForbiddenAccessException(string message = "You do not have permission to access this resource.") : base(message) { }
}
