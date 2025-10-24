using System.Collections.Generic;

namespace Lydian.SDK.Models
{
    public class Signal
    {
        public string? Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public object? Content { get; set; }
        public bool Processed { get; set; }
    }

    public class KnowledgeEntity
    {
        public string? Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public Dictionary<string, object>? Properties { get; set; }
    }

    public class Insight
    {
        public string? Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }
}
