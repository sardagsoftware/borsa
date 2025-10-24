package com.lydian.sdk;

import com.lydian.sdk.models.City;
import com.lydian.sdk.models.CityAsset;
import com.lydian.sdk.models.Alert;

import java.io.IOException;

/**
 * Client for Smart Cities API
 */
public class SmartCitiesClient {
    private final LydianClient client;

    public SmartCitiesClient(LydianClient client) {
        this.client = client;
    }

    public City createCity(City city) throws IOException {
        return client.request("POST", "/smart-cities/cities", city, City.class);
    }

    public City getCity(String cityId) throws IOException {
        return client.request("GET", "/smart-cities/cities/" + cityId, null, City.class);
    }

    public CityAsset createAsset(CityAsset asset) throws IOException {
        return client.request("POST", "/smart-cities/assets", asset, CityAsset.class);
    }

    public Alert createAlert(Alert alert) throws IOException {
        return client.request("POST", "/smart-cities/alerts", alert, Alert.class);
    }
}
