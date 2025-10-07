package com.lydian.sdk;

import com.lydian.sdk.models.Signal;
import com.lydian.sdk.models.KnowledgeEntity;
import com.lydian.sdk.models.Insight;

import java.io.IOException;

/**
 * Client for LyDian IQ API
 */
public class LydianIQClient {
    private final LydianClient client;

    public LydianIQClient(LydianClient client) {
        this.client = client;
    }

    public Signal ingestSignal(Signal signal) throws IOException {
        return client.request("POST", "/lydian-iq/signals", signal, Signal.class);
    }

    public KnowledgeEntity createEntity(KnowledgeEntity entity) throws IOException {
        return client.request("POST", "/lydian-iq/knowledge/entities", entity, KnowledgeEntity.class);
    }
}
