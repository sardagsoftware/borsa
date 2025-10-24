package com.lydian.sdk.models;

public class CityAsset {
    private String id;
    private String cityId;
    private String type;
    private String name;
    private String status;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCityId() { return cityId; }
    public void setCityId(String cityId) { this.cityId = cityId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
