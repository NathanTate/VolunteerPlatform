using System.Text.Json.Serialization;

namespace VolunteerPlatform.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InitiativeCategory
{
    Environmental,
    Social,
    Medical,
    Educational,
    Other
}
