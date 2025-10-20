package com.lydian.sdk;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import okhttp3.*;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Main Lydian SDK client
 */
public class LydianClient {
    private final OkHttpClient httpClient;
    private final Gson gson;
    private final String baseUrl;
    private final String apiKey;
    private String accessToken;

    public final SmartCitiesClient smartCities;
    public final InsanIQClient insanIQ;
    public final LydianIQClient lydianIQ;

    private LydianClient(Builder builder) {
        this.apiKey = builder.apiKey != null ? builder.apiKey : System.getenv("LYDIAN_API_KEY");
        this.baseUrl = builder.baseUrl != null ? builder.baseUrl : System.getenv().getOrDefault("LYDIAN_BASE_URL", "https://api.lydian.ai/v1");

        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(builder.timeout, TimeUnit.SECONDS)
                .readTimeout(builder.timeout, TimeUnit.SECONDS)
                .writeTimeout(builder.timeout, TimeUnit.SECONDS)
                .retryOnConnectionFailure(true)
                .build();

        this.gson = new GsonBuilder()
                .setPrettyPrinting()
                .create();

        this.smartCities = new SmartCitiesClient(this);
        this.insanIQ = new InsanIQClient(this);
        this.lydianIQ = new LydianIQClient(this);
    }

    /**
     * Authenticate with OAuth2
     */
    public void authenticateOAuth2(String clientId, String clientSecret) throws IOException {
        RequestBody formBody = new FormBody.Builder()
                .add("grant_type", "client_credentials")
                .add("client_id", clientId)
                .add("client_secret", clientSecret)
                .build();

        Request request = new Request.Builder()
                .url(baseUrl + "/oauth/token")
                .post(formBody)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new LydianException("OAuth2 authentication failed", response.code());
            }

            String responseBody = response.body().string();
            OAuthResponse oauthResponse = gson.fromJson(responseBody, OAuthResponse.class);
            this.accessToken = oauthResponse.accessToken;
        }
    }

    /**
     * Make HTTP request
     */
    public <T> T request(String method, String path, Object body, Class<T> responseType) throws IOException {
        HttpUrl url = HttpUrl.parse(baseUrl + path);
        if (url == null) {
            throw new IllegalArgumentException("Invalid URL: " + baseUrl + path);
        }

        Request.Builder requestBuilder = new Request.Builder().url(url);

        // Set headers
        requestBuilder.addHeader("Content-Type", "application/json");
        requestBuilder.addHeader("User-Agent", "lydian-java-sdk/1.0.0");

        if (accessToken != null) {
            requestBuilder.addHeader("Authorization", "Bearer " + accessToken);
        } else if (apiKey != null) {
            requestBuilder.addHeader("X-API-Key", apiKey);
        }

        // Set body
        if (body != null) {
            String jsonBody = gson.toJson(body);
            requestBuilder.method(method, RequestBody.create(jsonBody, MediaType.parse("application/json")));
        } else {
            requestBuilder.method(method, method.equals("GET") ? null : RequestBody.create("", null));
        }

        Request request = requestBuilder.build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "";
                throw new LydianException("Request failed: " + errorBody, response.code());
            }

            if (responseType == Void.class) {
                return null;
            }

            String responseBody = response.body().string();
            return gson.fromJson(responseBody, responseType);
        }
    }

    public Gson getGson() {
        return gson;
    }

    /**
     * Builder for LydianClient
     */
    public static class Builder {
        private String apiKey;
        private String baseUrl;
        private long timeout = 30;

        public Builder apiKey(String apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        public Builder baseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
            return this;
        }

        public Builder timeout(long timeout) {
            this.timeout = timeout;
            return this;
        }

        public LydianClient build() {
            return new LydianClient(this);
        }
    }

    private static class OAuthResponse {
        private String accessToken;
    }
}
