using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Entities;

namespace VolunteerPlatform.Application.Tasks.Commands.AddTaskComment;

public class AddTaskCommentCommandHandler : IRequestHandler<AddTaskCommentCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public AddTaskCommentCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Guid> Handle(AddTaskCommentCommand request, CancellationToken ct)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException($"Task {request.TaskId} not found.");

        var comment = new TaskComment
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            AuthorId = request.AuthorId,
            Text = request.Text,
            CreatedAt = DateTime.UtcNow
        };

        _context.TaskComments.Add(comment);
        await _context.SaveChangesAsync(ct);

        return comment.Id;
    }
}
