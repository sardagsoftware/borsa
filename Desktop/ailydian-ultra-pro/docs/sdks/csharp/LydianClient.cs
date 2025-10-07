using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Lydian.SDK
{
    public class LydianClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;
        private readonly string? _apiKey;
        private string? _accessToken;

        public SmartCitiesClient SmartCities { get; }
        public InsanIQClient InsanIQ { get; }
        public LydianIQClient LydianIQ { get; }

        public LydianClient(LydianConfig config)
        {
            _apiKey = config.ApiKey ?? Environment.GetEnvironmentVariable("LYDIAN_API_KEY");
            _baseUrl = config.BaseUrl ?? Environment.GetEnvironmentVariable("LYDIAN_BASE_URL") ?? "https://api.lydian.ai/v1";

            _httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(config.Timeout)
            };

            SmartCities = new SmartCitiesClient(this);
            InsanIQ = new InsanIQClient(this);
            LydianIQ = new LydianIQClient(this);
        }

        public async Task AuthenticateOAuth2Async(string clientId, string clientSecret, CancellationToken cancellationToken = default)
        {
            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type", "client_credentials"),
                new KeyValuePair<string, string>("client_id", clientId),
                new KeyValuePair<string, string>("client_secret", clientSecret)
            });

            var response = await _httpClient.PostAsync($"{_baseUrl}/oauth/token", content, cancellationToken);
            response.EnsureSuccessStatusCode();

            var result = await JsonSerializer.DeserializeAsync<OAuthResponse>(
                await response.Content.ReadAsStreamAsync(cancellationToken),
                cancellationToken: cancellationToken);

            _accessToken = result?.AccessToken;
        }

        internal async Task<T?> RequestAsync<T>(
            string method,
            string path,
            object? body = null,
            CancellationToken cancellationToken = default)
        {
            var request = new HttpRequestMessage(new HttpMethod(method), $"{_baseUrl}{path}");

            // Set headers
            request.Headers.Add("User-Agent", "lydian-csharp-sdk/1.0.0");
            if (_accessToken != null)
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
            }
            else if (_apiKey != null)
            {
                request.Headers.Add("X-API-Key", _apiKey);
            }

            // Set body
            if (body != null)
            {
                var json = JsonSerializer.Serialize(body);
                request.Content = new StringContent(json, Encoding.UTF8, "application/json");
            }

            var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
            return await JsonSerializer.DeserializeAsync<T>(responseStream, cancellationToken: cancellationToken);
        }

        private class OAuthResponse
        {
            public string? AccessToken { get; set; }
        }
    }

    public class LydianConfig
    {
        public string? ApiKey { get; set; }
        public string? BaseUrl { get; set; }
        public int Timeout { get; set; } = 30;
    }

    public class LydianException : Exception
    {
        public int StatusCode { get; }

        public LydianException(string message, int statusCode) : base(message)
        {
            StatusCode = statusCode;
        }
    }
}
