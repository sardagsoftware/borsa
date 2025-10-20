"""İnsan IQ API examples"""

import os
from lydian import Lydian

lydian = Lydian(api_key=os.environ.get("LYDIAN_API_KEY"))

# 1. Create persona
persona = lydian.insan_iq.create_persona(
    name="Dr. Sarah Chen",
    persona_type="doctor",
    description="Cardiology specialist with 15 years of experience",
    capabilities=["diagnosis", "treatment-planning", "patient-consultation"],
    metadata={"specialty": "Cardiology", "languages": ["English", "Mandarin"]}
)
print(f"Persona created: {persona.id}")

# 2. Publish skill
skill = lydian.insan_iq.publish_skill(
    persona_id=persona.id,
    name="Echocardiogram Analysis",
    category="diagnostic",
    proficiency_level=95,
    description="Expert in reading and interpreting echocardiograms",
    metadata={"years_of_experience": 12, "cases_analyzed": 5000}
)
print(f"Skill published: {skill.id}")

# 3. List skills
skills = lydian.insan_iq.list_skills(persona.id)
print(f"Persona has {len(skills.data)} skills")

# 4. Create chat session
session = lydian.insan_iq.create_session(
    persona_id=persona.id,
    user_id="user-123",
    title="Patient consultation - Case #456"
)
print(f"Session created: {session.id}")

# 5. Send message
message = lydian.insan_iq.send_message(
    session.id,
    "Patient presents with chest pain and shortness of breath"
)
print(f"Message sent: {message.id}")

# 6. Get session history
history = lydian.insan_iq.get_session_history(session.id)
print(f"Session has {len(history.data)} messages")

for msg in history.data:
    print(f"[{msg.role}]: {msg.content[:100]}...")
