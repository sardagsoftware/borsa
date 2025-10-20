using System.Threading;
using System.Threading.Tasks;
using Lydian.SDK.Models;

namespace Lydian.SDK
{
    public class LydianIQClient
    {
        private readonly LydianClient _client;

        public LydianIQClient(LydianClient client)
        {
            _client = client;
        }

        public async Task<Signal> IngestSignalAsync(Signal signal, CancellationToken cancellationToken = default)
        {
            return await _client.RequestAsync<Signal>("POST", "/lydian-iq/signals", signal, cancellationToken)
                ?? throw new LydianException("Failed to ingest signal", 500);
        }

        public async Task<KnowledgeEntity> CreateEntityAsync(KnowledgeEntity entity, CancellationToken cancellationToken = default)
        {
            return await _client.RequestAsync<KnowledgeEntity>("POST", "/lydian-iq/knowledge/entities", entity, cancellationToken)
                ?? throw new LydianException("Failed to create entity", 500);
        }
    }
}
