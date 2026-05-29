using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Entities;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Tasks.Commands.CreateTask;

public class CreateTaskCommandHandler : IRequestHandler<CreateTaskCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateTaskCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Guid> Handle(CreateTaskCommand request, CancellationToken ct)
    {
        var initiative = await _context.Initiatives
            .FirstOrDefaultAsync(i => i.Id == request.InitiativeId, ct)
            ?? throw new KeyNotFoundException($"Initiative {request.InitiativeId} not found.");

        if (initiative.Status == InitiativeStatus.Archived || initiative.Status == InitiativeStatus.Completed)
            throw new InvalidOperationException("Cannot add tasks to an archived or completed initiative.");

        var task = new VolunteerTask
        {
            Id = Guid.NewGuid(),
            InitiativeId = request.InitiativeId,
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            Status = VolunteerTaskStatus.Pending,
            Deadline = request.Deadline,
            CreatedById = request.CreatedById,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync(ct);

        return task.Id;
    }
}
