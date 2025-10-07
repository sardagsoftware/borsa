import { Lydian } from '@lydian/sdk';

const lydian = new Lydian({
  apiKey: process.env.LYDIAN_API_KEY,
});

async function insanIQExample() {
  // 1. Create a doctor persona
  const persona = await lydian.insanIQ.createPersona({
    name: 'Dr. Sarah Chen',
    type: 'doctor',
    description: 'Cardiology specialist with 15 years of experience',
    capabilities: [
      'diagnosis',
      'treatment-planning',
      'patient-consultation',
      'research',
    ],
    metadata: {
      specialty: 'Cardiology',
      languages: ['English', 'Mandarin'],
      certifications: ['ABIM', 'FACC'],
    },
  });

  console.log('Persona created:', persona.id);

  // 2. Publish skills to persona
  const skill = await lydian.insanIQ.publishSkill({
    personaId: persona.id,
    name: 'Echocardiogram Analysis',
    category: 'diagnostic',
    proficiencyLevel: 95,
    description: 'Expert in reading and interpreting echocardiograms',
    metadata: {
      yearsOfExperience: 12,
      casesAnalyzed: 5000,
    },
  });

  console.log('Skill published:', skill.id);

  // 3. List all skills
  const skills = await lydian.insanIQ.listSkills(persona.id);
  console.log(`Persona has ${skills.data.length} skills`);

  // 4. Create chat session
  const session = await lydian.insanIQ.createSession({
    personaId: persona.id,
    userId: 'user-123',
    title: 'Patient consultation - Case #456',
  });

  console.log('Session created:', session.id);

  // 5. Send messages
  const message1 = await lydian.insanIQ.sendMessage(
    session.id,
    'Patient presents with chest pain and shortness of breath'
  );

  console.log('User message:', message1.content);

  // Get assistant response
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for processing

  // 6. Get session history
  const history = await lydian.insanIQ.getSessionHistory(session.id);
  console.log(`Session has ${history.data.length} messages`);

  history.data.forEach(msg => {
    console.log(`[${msg.role}]: ${msg.content.substring(0, 100)}...`);
  });
}

insanIQExample().catch(console.error);
