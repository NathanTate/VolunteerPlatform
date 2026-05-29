export interface VolunteerRecommendationDto {
  volunteerId: string;
  fullName: string;
  email: string;

  /** Approved applications in the same category as the target initiative. */
  categoryApplications: number;

  /** Total approved applications across all initiatives. */
  totalApplications: number;

  /** Currently active (Accepted / InProgress) tasks — lower is better. */
  activeTasks: number;

  /** Completed or Verified tasks — higher is better. */
  completedTasks: number;

  /** Composite 0–100 recommendation score. */
  recommendationScore: number;

  // Score components (0–100 each) for frontend visualisation
  categoryAffinityScore: number;
  completionRateScore: number;
  availabilityScore: number;
  activityScore: number;
}
