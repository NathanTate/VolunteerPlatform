namespace VolunteerPlatform.Application.Dashboard.Queries.GetDashboardStats;

public class DashboardStatsDto
{
    // Initiatives
    public int ActiveInitiatives { get; set; }
    public int PlannedInitiatives { get; set; }
    public int CompletedInitiatives { get; set; }
    public int EmergencyInitiatives { get; set; }
    public int TotalInitiatives { get; set; }

    // Volunteers
    public int TotalVolunteers { get; set; }

    // Tasks
    public int TasksPending { get; set; }
    public int TasksAccepted { get; set; }
    public int TasksInProgress { get; set; }
    public int TasksCompleted { get; set; }
    public int TasksVerified { get; set; }
    public int TasksRejected { get; set; }
    public int TasksOverdue { get; set; }
    public int TasksCompletedToday { get; set; }
    public int TotalTasks { get; set; }

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
