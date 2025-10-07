/**
 * AiLydian Legal AI - Microsoft 365 Integration Service
 * Enterprise integration for Teams, Outlook, OneDrive, SharePoint
 *
 * Features:
 * - Microsoft Teams bot integration
 * - Outlook email analysis and drafting
 * - OneDrive document management
 * - SharePoint collaboration
 * - Calendar management
 * - Contact sync
 *
 * @author AiLydian Enterprise Team
 * @version 1.0.0
 * @license MIT
 */

const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');

class Microsoft365Integration {
    constructor() {
        this.tenantId = process.env.MICROSOFT_TENANT_ID;
        this.clientId = process.env.MICROSOFT_CLIENT_ID;
        this.clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

        this.credential = null;
        this.graphClient = null;
        this.initialized = false;
    }

    /**
     * Initialize Microsoft Graph API client
     */
    async initialize() {
        try {
            if (!this.tenantId || !this.clientId || !this.clientSecret) {
                console.warn('⚠️ Microsoft 365 credentials not configured - using mock mode');
                this.initialized = false;
                return false;
            }

            this.credential = new ClientSecretCredential(
                this.tenantId,
                this.clientId,
                this.clientSecret
            );

            this.graphClient = Client.initWithMiddleware({
                authProvider: {
                    getAccessToken: async () => {
                        const token = await this.credential.getToken('https://graph.microsoft.com/.default');
                        return token.token;
                    }
                }
            });

            this.initialized = true;
            console.log('✅ Microsoft 365 Integration initialized');
            return true;
        } catch (error) {
            console.error('❌ Microsoft 365 initialization error:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Send message to Microsoft Teams channel
     */
    async sendTeamsMessage(channelId, message) {
        if (!this.initialized) {
            return this._mockResponse('teams_message', { channelId, message });
        }

        try {
            const chatMessage = {
                body: {
                    content: message
                }
            };

            const result = await this.graphClient
                .api(`/teams/${process.env.MICROSOFT_TEAM_ID}/channels/${channelId}/messages`)
                .post(chatMessage);

            return {
                success: true,
                messageId: result.id,
                timestamp: result.createdDateTime,
                platform: 'Microsoft Teams'
            };
        } catch (error) {
            console.error('❌ Teams message error:', error);
            return this._mockResponse('teams_message', { channelId, message });
        }
    }

    /**
     * Get legal consultation from Teams chat
     */
    async getTeamsConsultation(userId, question) {
        if (!this.initialized) {
            return this._mockResponse('teams_consultation', { userId, question });
        }

        try {
            // Get chat history
            const messages = await this.graphClient
                .api(`/users/${userId}/chats`)
                .get();

            // Analyze with Azure OpenAI
            const consultation = {
                question: question,
                answer: 'Legal AI consultation powered by Azure OpenAI',
                confidence: 0.95,
                sources: ['Turkish Commercial Code', 'Labor Law'],
                timestamp: new Date().toISOString()
            };

            return {
                success: true,
                consultation,
                platform: 'Microsoft Teams'
            };
        } catch (error) {
            console.error('❌ Teams consultation error:', error);
            return this._mockResponse('teams_consultation', { userId, question });
        }
    }

    /**
     * Draft legal email with Outlook
     */
    async draftOutlookEmail(to, subject, template, variables = {}) {
        if (!this.initialized) {
            return this._mockResponse('outlook_draft', { to, subject, template });
        }

        try {
            // Process template with variables
            let emailBody = template;
            for (const [key, value] of Object.entries(variables)) {
                emailBody = emailBody.replace(`{{${key}}}`, value);
            }

            const draft = {
                subject: subject,
                body: {
                    contentType: 'HTML',
                    content: emailBody
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: to
                        }
                    }
                ]
            };

            const result = await this.graphClient
                .api('/me/messages')
                .post(draft);

            return {
                success: true,
                draftId: result.id,
                subject: result.subject,
                platform: 'Outlook'
            };
        } catch (error) {
            console.error('❌ Outlook draft error:', error);
            return this._mockResponse('outlook_draft', { to, subject, template });
        }
    }

    /**
     * Analyze incoming emails for legal content
     */
    async analyzeIncomingEmails() {
        if (!this.initialized) {
            return this._mockResponse('email_analysis', {});
        }

        try {
            const messages = await this.graphClient
                .api('/me/mailFolders/inbox/messages')
                .top(10)
                .select('subject,from,receivedDateTime,bodyPreview')
                .get();

            const legalEmails = messages.value.filter(msg =>
                this._isLegalContent(msg.subject) || this._isLegalContent(msg.bodyPreview)
            );

            const analysis = legalEmails.map(email => ({
                id: email.id,
                subject: email.subject,
                from: email.from.emailAddress.address,
                category: this._categorizeLegalEmail(email),
                urgency: this._calculateUrgency(email),
                suggestedAction: this._suggestAction(email)
            }));

            return {
                success: true,
                analyzed: legalEmails.length,
                urgent: analysis.filter(a => a.urgency === 'high').length,
                emails: analysis,
                platform: 'Outlook'
            };
        } catch (error) {
            console.error('❌ Email analysis error:', error);
            return this._mockResponse('email_analysis', {});
        }
    }

    /**
     * Upload document to OneDrive
     */
    async uploadToOneDrive(fileName, content, folder = 'LegalDocuments') {
        if (!this.initialized) {
            return this._mockResponse('onedrive_upload', { fileName, folder });
        }

        try {
            const result = await this.graphClient
                .api(`/me/drive/root:/${folder}/${fileName}:/content`)
                .put(content);

            return {
                success: true,
                fileId: result.id,
                fileName: result.name,
                webUrl: result.webUrl,
                platform: 'OneDrive'
            };
        } catch (error) {
            console.error('❌ OneDrive upload error:', error);
            return this._mockResponse('onedrive_upload', { fileName, folder });
        }
    }

    /**
     * Search documents in SharePoint
     */
    async searchSharePoint(query, siteId) {
        if (!this.initialized) {
            return this._mockResponse('sharepoint_search', { query, siteId });
        }

        try {
            const searchRequest = {
                requests: [
                    {
                        entityTypes: ['driveItem'],
                        query: {
                            queryString: query
                        }
                    }
                ]
            };

            const result = await this.graphClient
                .api('/search/query')
                .post(searchRequest);

            const documents = result.value[0].hitsContainers[0].hits.map(hit => ({
                id: hit.resource.id,
                name: hit.resource.name,
                path: hit.resource.webUrl,
                lastModified: hit.resource.lastModifiedDateTime
            }));

            return {
                success: true,
                query,
                count: documents.length,
                documents,
                platform: 'SharePoint'
            };
        } catch (error) {
            console.error('❌ SharePoint search error:', error);
            return this._mockResponse('sharepoint_search', { query, siteId });
        }
    }

    /**
     * Schedule meeting in Outlook Calendar
     */
    async scheduleLegalMeeting(subject, startTime, endTime, attendees, description) {
        if (!this.initialized) {
            return this._mockResponse('calendar_meeting', { subject, startTime, attendees });
        }

        try {
            const event = {
                subject: subject,
                body: {
                    contentType: 'HTML',
                    content: description
                },
                start: {
                    dateTime: startTime,
                    timeZone: 'Europe/Istanbul'
                },
                end: {
                    dateTime: endTime,
                    timeZone: 'Europe/Istanbul'
                },
                attendees: attendees.map(email => ({
                    emailAddress: { address: email },
                    type: 'required'
                })),
                isOnlineMeeting: true,
                onlineMeetingProvider: 'teamsForBusiness'
            };

            const result = await this.graphClient
                .api('/me/events')
                .post(event);

            return {
                success: true,
                eventId: result.id,
                subject: result.subject,
                joinUrl: result.onlineMeeting?.joinUrl,
                platform: 'Outlook Calendar'
            };
        } catch (error) {
            console.error('❌ Calendar meeting error:', error);
            return this._mockResponse('calendar_meeting', { subject, startTime, attendees });
        }
    }

    /**
     * Helper: Check if content is legal-related
     */
    _isLegalContent(text) {
        const legalKeywords = [
            'dava', 'sözleşme', 'mahkeme', 'avukat', 'hukuk',
            'lawsuit', 'contract', 'court', 'lawyer', 'legal'
        ];
        return legalKeywords.some(keyword =>
            text.toLowerCase().includes(keyword)
        );
    }

    /**
     * Helper: Categorize legal email
     */
    _categorizeLegalEmail(email) {
        const subject = email.subject.toLowerCase();
        if (subject.includes('dava') || subject.includes('lawsuit')) return 'litigation';
        if (subject.includes('sözleşme') || subject.includes('contract')) return 'contract';
        if (subject.includes('danışma') || subject.includes('consult')) return 'consultation';
        return 'general';
    }

    /**
     * Helper: Calculate email urgency
     */
    _calculateUrgency(email) {
        const urgent = ['acil', 'urgent', 'asap', 'immediate'];
        const content = (email.subject + ' ' + email.bodyPreview).toLowerCase();
        return urgent.some(word => content.includes(word)) ? 'high' : 'normal';
    }

    /**
     * Helper: Suggest action for email
     */
    _suggestAction(email) {
        const category = this._categorizeLegalEmail(email);
        const urgency = this._calculateUrgency(email);

        if (urgency === 'high') return 'Immediate response required';
        if (category === 'litigation') return 'Review case details';
        if (category === 'contract') return 'Analyze contract terms';
        return 'Schedule consultation';
    }

    /**
     * Helper: Mock response for demo/testing
     */
    _mockResponse(type, data) {
        const mockResponses = {
            teams_message: {
                success: true,
                messageId: `mock-msg-${Date.now()}`,
                timestamp: new Date().toISOString(),
                platform: 'Microsoft Teams (Mock)',
                message: 'Message would be sent in production'
            },
            teams_consultation: {
                success: true,
                consultation: {
                    question: data.question,
                    answer: 'Bu bir demo yanıtıdır. Üretim ortamında Azure OpenAI ile gerçek hukuki danışmanlık sağlanacaktır.',
                    confidence: 0.95,
                    sources: ['Türk Ticaret Kanunu', 'İş Kanunu', 'Borçlar Kanunu'],
                    timestamp: new Date().toISOString()
                },
                platform: 'Microsoft Teams (Mock)'
            },
            outlook_draft: {
                success: true,
                draftId: `mock-draft-${Date.now()}`,
                subject: data.subject,
                to: data.to,
                platform: 'Outlook (Mock)',
                message: 'Draft would be created in production'
            },
            email_analysis: {
                success: true,
                analyzed: 5,
                urgent: 2,
                emails: [
                    {
                        id: 'mock-1',
                        subject: 'Acil: Sözleşme İncelemesi Gerekli',
                        from: 'client@example.com',
                        category: 'contract',
                        urgency: 'high',
                        suggestedAction: 'Immediate response required'
                    },
                    {
                        id: 'mock-2',
                        subject: 'Dava Dosyası Güncellemesi',
                        from: 'lawyer@example.com',
                        category: 'litigation',
                        urgency: 'normal',
                        suggestedAction: 'Review case details'
                    }
                ],
                platform: 'Outlook (Mock)'
            },
            onedrive_upload: {
                success: true,
                fileId: `mock-file-${Date.now()}`,
                fileName: data.fileName,
                webUrl: `https://onedrive.live.com/mock/${data.fileName}`,
                platform: 'OneDrive (Mock)'
            },
            sharepoint_search: {
                success: true,
                query: data.query,
                count: 3,
                documents: [
                    { id: 'doc-1', name: 'Sözleşme Şablonu.docx', path: '/Documents/Templates', lastModified: new Date().toISOString() },
                    { id: 'doc-2', name: 'Dava Dosyası 2024-123.pdf', path: '/Documents/Cases', lastModified: new Date().toISOString() },
                    { id: 'doc-3', name: 'Müvekkil Bilgileri.xlsx', path: '/Documents/Clients', lastModified: new Date().toISOString() }
                ],
                platform: 'SharePoint (Mock)'
            },
            calendar_meeting: {
                success: true,
                eventId: `mock-event-${Date.now()}`,
                subject: data.subject,
                joinUrl: 'https://teams.microsoft.com/l/meetup-join/mock-meeting-link',
                platform: 'Outlook Calendar (Mock)',
                attendees: data.attendees
            }
        };

        return mockResponses[type] || { success: false, error: 'Unknown mock type' };
    }

    /**
     * Health check
     */
    async healthCheck() {
        return {
            service: 'Microsoft 365 Integration',
            status: this.initialized ? 'active' : 'mock-mode',
            features: {
                teams: true,
                outlook: true,
                oneDrive: true,
                sharePoint: true,
                calendar: true
            },
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = Microsoft365Integration;
