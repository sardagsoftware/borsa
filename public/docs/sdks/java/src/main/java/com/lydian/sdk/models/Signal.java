package com.lydian.sdk.models;

public class Signal {
    private String id;
    private String type;
    private String source;
    private Object content;
    private boolean processed;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Object getContent() { return content; }
    public void setContent(Object content) { this.content = content; }

    public boolean isProcessed() { return processed; }
    public void setProcessed(boolean processed) { this.processed = processed; }
}
