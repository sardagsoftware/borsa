package com.lydian.sdk;

import com.lydian.sdk.models.Persona;
import com.lydian.sdk.models.Skill;
import com.lydian.sdk.models.ChatSession;

import java.io.IOException;

/**
 * Client for İnsan IQ API
 */
public class InsanIQClient {
    private final LydianClient client;

    public InsanIQClient(LydianClient client) {
        this.client = client;
    }

    public Persona createPersona(Persona persona) throws IOException {
        return client.request("POST", "/insan-iq/personas", persona, Persona.class);
    }

    public Skill publishSkill(Skill skill) throws IOException {
        return client.request("POST", "/insan-iq/skills", skill, Skill.class);
    }

    public ChatSession createSession(ChatSession session) throws IOException {
        return client.request("POST", "/insan-iq/sessions", session, ChatSession.class);
    }
}
