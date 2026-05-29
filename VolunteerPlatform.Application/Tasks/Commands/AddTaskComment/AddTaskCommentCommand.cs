using MediatR;

namespace VolunteerPlatform.Application.Tasks.Commands.AddTaskComment;

public record AddTaskCommentCommand(Guid TaskId, string AuthorId, string Text) : IRequest<Guid>;
