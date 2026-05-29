namespace VolunteerPlatform.Application.Volunteers.Queries.GetVolunteerRecommendations;

public class VolunteerRecommendationDto
{
    public string VolunteerId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    /// <summary>Approved applications in the same category as the target initiative.</summary>
    public int CategoryApplications { get; set; }

    /// <summary>Total approved applications across all initiatives.</summary>
    public int TotalApplications { get; set; }

    /// <summary>Currently active (Accepted / InProgress) tasks — lower is better.</summary>
    public int ActiveTasks { get; set; }

    /// <summary>Completed or Verified tasks — higher is better.</summary>
    public int CompletedTasks { get; set; }

    /// <summary>Composite 0–100 recommendation score.</summary>
    public double RecommendationScore { get; set; }

    // Score components (0–100 each) for frontend visualisation
    public double CategoryAffinityScore { get; set; }
    public double CompletionRateScore { get; set; }
    public double AvailabilityScore { get; set; }
    public double ActivityScore { get; set; }
}
