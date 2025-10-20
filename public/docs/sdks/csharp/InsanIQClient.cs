using System.Threading;
using System.Threading.Tasks;
using Lydian.SDK.Models;

namespace Lydian.SDK
{
    public class InsanIQClient
    {
        private readonly LydianClient _client;

        public InsanIQClient(LydianClient client)
        {
            _client = client;
        }

        public async Task<Persona> CreatePersonaAsync(Persona persona, CancellationToken cancellationToken = default)
        {
            return await _client.RequestAsync<Persona>("POST", "/insan-iq/personas", persona, cancellationToken)
                ?? throw new LydianException("Failed to create persona", 500);
        }

        public async Task<Skill> PublishSkillAsync(Skill skill, CancellationToken cancellationToken = default)
        {
            return await _client.RequestAsync<Skill>("POST", "/insan-iq/skills", skill, cancellationToken)
                ?? throw new LydianException("Failed to publish skill", 500);
        }

        public async Task<ChatSession> CreateSessionAsync(ChatSession session, CancellationToken cancellationToken = default)
        {
            return await _client.RequestAsync<ChatSession>("POST", "/insan-iq/sessions", session, cancellationToken)
                ?? throw new LydianException("Failed to create session", 500);
        }
    }
}
