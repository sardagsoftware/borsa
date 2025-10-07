using System.Collections.Generic;

namespace Lydian.SDK.Models
{
    public class Persona
    {
        public string? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string>? Capabilities { get; set; }
    }

    public class Skill
    {
        public string? Id { get; set; }
        public string PersonaId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int ProficiencyLevel { get; set; }
    }

    public class ChatSession
    {
        public string? Id { get; set; }
        public string PersonaId { get; set; } = string.Empty;
        public string? UserId { get; set; }
        public string? Title { get; set; }
        public string Status { get; set; } = "active";
    }
}
