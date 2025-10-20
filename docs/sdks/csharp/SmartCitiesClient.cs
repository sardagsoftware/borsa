using System.Threading;
using System.Threading.Tasks;
using Lydian.SDK.Models;

namespace Lydian.SDK
{
    public class SmartCitiesClient
    {
        private readonly LydianClient _client;

        public SmartCitiesClient(LydianClient client)
        {
            _client = client;
        }

        public async Task<City> CreateCityAsync(City city, CancellationToken cancellationToken = default)
        {
            return await _client.RequestAsync<City>("POST", "/smart-cities/cities", city, cancellationToken)
                ?? throw new LydianException("Failed to create city", 500);
        }

        public async Task<City> GetCityAsync(string cityId, CancellationToken cancellationToken = default)
        {
            return await _client.RequestAsync<City>("GET", $"/smart-cities/cities/{cityId}", null, cancellationToken)
                ?? throw new LydianException("City not found", 404);
        }

        public async Task<CityAsset> CreateAssetAsync(CityAsset asset, CancellationToken cancellationToken = default)
        {
            return await _client.RequestAsync<CityAsset>("POST", "/smart-cities/assets", asset, cancellationToken)
                ?? throw new LydianException("Failed to create asset", 500);
        }

        public async Task<Alert> CreateAlertAsync(Alert alert, CancellationToken cancellationToken = default)
        {
            return await _client.RequestAsync<Alert>("POST", "/smart-cities/alerts", alert, cancellationToken)
                ?? throw new LydianException("Failed to create alert", 500);
        }
    }
}
