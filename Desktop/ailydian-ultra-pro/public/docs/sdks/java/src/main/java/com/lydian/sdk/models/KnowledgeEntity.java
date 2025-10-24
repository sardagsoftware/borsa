package com.lydian.sdk.models;

import java.util.Map;

public class KnowledgeEntity {
    private String id;
    private String type;
    private String name;
    private Map<String, Object> properties;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Map<String, Object> getProperties() { return properties; }
    public void setProperties(Map<String, Object> properties) { this.properties = properties; }
}
