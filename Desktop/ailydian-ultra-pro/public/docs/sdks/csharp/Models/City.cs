using System.Collections.Generic;

namespace Lydian.SDK.Models
{
    public class City
    {
        public string? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public int? Population { get; set; }
        public string? Timezone { get; set; }
        public Dictionary<string, object>? Metadata { get; set; }
        public string? CreatedAt { get; set; }
        public string? UpdatedAt { get; set; }
    }

    public class CityAsset
    {
        public string? Id { get; set; }
        public string CityId { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = "active";
    }

    public class Alert
    {
        public string? Id { get; set; }
        public string CityId { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "open";
    }
}
