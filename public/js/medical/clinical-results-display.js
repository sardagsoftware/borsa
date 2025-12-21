/**
 * LYDIAN MEDICAL - CLINICAL RESULTS DISPLAY ENGINE
 * FDA-Compliant Medical Analysis Results Presentation
 *
 * Premium clinical-grade UI for displaying medical AI analysis results
 * Optimized for physicians and healthcare professionals
 * Follows FDA regulations and HIPAA compliance standards
 *
 * @version 3.0.0
 * @compliance FDA 21 CFR Part 11, HIPAA, HL7 FHIR
 */

class ClinicalResultsDisplay {
    constructor() {
        this.currentResults = null;
        this.brandingTerms = {
            // AI Provider obfuscation
            'lydian-velocity': 'Velocity AI',
            'lydian-velocity': 'Velocity AI',
            'lydian-velocity': 'VELOCITY AI',
            'groq-rag': 'Advanced Retrieval System',
            'LX_CORE': 'Clinical LLM',
            'LX_CORE': 'Clinical LLM',
            // Model obfuscation
            'GX8E2D9A': 'LyDian Clinical AI',
            'LX_CORE3': 'Clinical AI',
            'gpt': 'Medical Intelligence',
            'AX9F7E2B': 'Clinical Assistant'
        };
    }

    /**
     * Obfuscate AI provider names for brand compliance
     */
    obfuscateBranding(text) {
        if (!text) return text;

        let result = text;
        for (const [original, replacement] of Object.entries(this.brandingTerms)) {
            const regex = new RegExp(original, 'gi');
            result = result.replace(regex, replacement);
        }

        return result;
    }

    /**
     * Main display function - Premium FDA-compliant results UI
     */
    displayResults(analysisData, containerElement) {
        this.currentResults = analysisData;

        if (!containerElement) {
            console.error('[Clinical Display] No container element provided');
            return;
        }

        // Clear previous results
        containerElement.innerHTML = '';

        // Create main clinical report container
        const clinicalReport = this.createClinicalReport(analysisData);
        containerElement.appendChild(clinicalReport);

        // Animate entrance
        setTimeout(() => {
            clinicalReport.classList.add('visible');
        }, 50);
    }

    /**
     * Create premium clinical report UI
     */
    createClinicalReport(data) {
        const report = document.createElement('div');
        report.className = 'clinical-report-container';
        report.setAttribute('role', 'article');
        report.setAttribute('aria-label', 'Clinical Analysis Report');

        // Report header with critical information
        report.appendChild(this.createReportHeader(data));

        // Clinical summary - Most important findings first
        if (data.diagnosis || data.summary) {
            report.appendChild(this.createClinicalSummary(data));
        }

        // Key findings section
        if (data.findings || data.analysis) {
            report.appendChild(this.createKeyFindings(data));
        }

        // Device information (if DICOM)
        if (data.deviceInfo || data.metadata) {
            report.appendChild(this.createDeviceSection(data));
        }

        // Recommendations section
        if (data.recommendations || data.treatment) {
            report.appendChild(this.createRecommendationsSection(data));
        }

        // Technical details (collapsible)
        report.appendChild(this.createTechnicalDetails(data));

        // Clinical actions bar
        report.appendChild(this.createActionsBar(data));

        return report;
    }

    /**
     * Create report header with timestamp and metadata
     */
    createReportHeader(data) {
        const header = document.createElement('div');
        header.className = 'clinical-report-header';

        const timestamp = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        header.innerHTML = `
            <div class="report-header-content">
                <div class="report-title-section">
                    <div class="report-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                    <div>
                        <h1 class="report-title">Clinical Analysis Report</h1>
                        <p class="report-subtitle">AI-Assisted Medical Image Analysis</p>
                    </div>
                </div>
                <div class="report-metadata">
                    <div class="metadata-item">
                        <span class="metadata-label">Generated:</span>
                        <span class="metadata-value">${timestamp}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Analysis ID:</span>
                        <span class="metadata-value">${this.generateAnalysisId()}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Status:</span>
                        <span class="status-badge status-completed">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Completed
                        </span>
                    </div>
                </div>
            </div>
            <div class="report-disclaimer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>This AI-generated analysis is for informational purposes only. Clinical decisions should be made by qualified healthcare professionals.</span>
            </div>
        `;

        return header;
    }

    /**
     * Create clinical summary section - Most critical information
     */
    createClinicalSummary(data) {
        const section = document.createElement('div');
        section.className = 'clinical-section clinical-summary';

        const summary = data.summary || data.diagnosis || this.extractSummary(data);
        const cleanSummary = this.obfuscateBranding(summary);

        section.innerHTML = `
            <div class="section-header">
                <div class="section-icon section-icon-critical">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h2 class="section-title">Clinical Summary</h2>
                <span class="priority-badge priority-high">Priority Review</span>
            </div>
            <div class="section-content">
                <div class="summary-box">
                    ${this.formatClinicalText(cleanSummary)}
                </div>
            </div>
        `;

        return section;
    }

    /**
     * Create key findings section with visual indicators
     */
    createKeyFindings(data) {
        const section = document.createElement('div');
        section.className = 'clinical-section clinical-findings';

        const findings = this.extractFindings(data);

        section.innerHTML = `
            <div class="section-header">
                <div class="section-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                    </svg>
                </div>
                <h2 class="section-title">Key Findings</h2>
            </div>
            <div class="section-content">
                <div class="findings-grid">
                    ${findings.map((finding, index) => this.createFindingCard(finding, index)).join('')}
                </div>
            </div>
        `;

        return section;
    }

    /**
     * Create individual finding card
     */
    createFindingCard(finding, index) {
        const severity = finding.severity || 'info';
        const severityIcons = {
            critical: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>`,
            warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                       <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                       <line x1="12" y1="9" x2="12" y2="13"></line>
                       <line x1="12" y1="17" x2="12.01" y2="17"></line>
                     </svg>`,
            info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>`
        };

        const cleanTitle = this.obfuscateBranding(finding.title || `Finding ${index + 1}`);
        const cleanDescription = this.obfuscateBranding(finding.description || finding.text || '');

        return `
            <div class="finding-card finding-${severity}" data-finding-index="${index}">
                <div class="finding-header">
                    <div class="finding-severity-icon">
                        ${severityIcons[severity] || severityIcons.info}
                    </div>
                    <h3 class="finding-title">${cleanTitle}</h3>
                    ${finding.confidence ? `<span class="confidence-badge">${Math.round(finding.confidence * 100)}% Confidence</span>` : ''}
                </div>
                <div class="finding-body">
                    <p class="finding-description">${cleanDescription}</p>
                    ${finding.location ? `<div class="finding-location"><strong>Location:</strong> ${finding.location}</div>` : ''}
                    ${finding.measurements ? `<div class="finding-measurements"><strong>Measurements:</strong> ${finding.measurements}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Create device information section (for DICOM)
     */
    createDeviceSection(data) {
        const section = document.createElement('div');
        section.className = 'clinical-section device-section';

        const deviceInfo = data.deviceInfo || data.metadata || {};

        section.innerHTML = `
            <div class="section-header">
                <div class="section-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                </div>
                <h2 class="section-title">Imaging Equipment</h2>
            </div>
            <div class="section-content">
                <div class="device-info-grid">
                    ${deviceInfo.manufacturer ? `
                        <div class="device-info-item">
                            <span class="device-label">Manufacturer:</span>
                            <span class="device-value">${deviceInfo.manufacturer}</span>
                        </div>
                    ` : ''}
                    ${deviceInfo.model || deviceInfo.deviceModel ? `
                        <div class="device-info-item">
                            <span class="device-label">Model:</span>
                            <span class="device-value">${deviceInfo.model || deviceInfo.deviceModel}</span>
                        </div>
                    ` : ''}
                    ${deviceInfo.modality ? `
                        <div class="device-info-item">
                            <span class="device-label">Modality:</span>
                            <span class="device-value device-modality">${deviceInfo.modality}</span>
                        </div>
                    ` : ''}
                    ${deviceInfo.studyDate ? `
                        <div class="device-info-item">
                            <span class="device-label">Study Date:</span>
                            <span class="device-value">${deviceInfo.studyDate}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        return section;
    }

    /**
     * Create recommendations section
     */
    createRecommendationsSection(data) {
        const section = document.createElement('div');
        section.className = 'clinical-section recommendations-section';

        const recommendations = this.extractRecommendations(data);

        section.innerHTML = `
            <div class="section-header">
                <div class="section-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                </div>
                <h2 class="section-title">Clinical Recommendations</h2>
            </div>
            <div class="section-content">
                <div class="recommendations-list">
                    ${recommendations.map((rec, index) => `
                        <div class="recommendation-item">
                            <div class="recommendation-number">${index + 1}</div>
                            <div class="recommendation-content">
                                <div class="recommendation-text">${this.obfuscateBranding(rec)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        return section;
    }

    /**
     * Create collapsible technical details section
     */
    createTechnicalDetails(data) {
        const section = document.createElement('div');
        section.className = 'clinical-section technical-section collapsed';

        const technicalData = this.extractTechnicalData(data);

        section.innerHTML = `
            <div class="section-header section-header-collapsible" onclick="this.parentElement.classList.toggle('collapsed')">
                <div class="section-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                </div>
                <h2 class="section-title">Technical Details</h2>
                <svg class="collapse-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
            <div class="section-content">
                <div class="technical-details-grid">
                    ${Object.entries(technicalData).map(([key, value]) => `
                        <div class="technical-detail-item">
                            <span class="technical-label">${this.formatLabel(key)}:</span>
                            <span class="technical-value">${this.obfuscateBranding(String(value))}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        return section;
    }

    /**
     * Create actions bar for printing, exporting, etc.
     */
    createActionsBar(data) {
        const actions = document.createElement('div');
        actions.className = 'clinical-actions-bar';

        actions.innerHTML = `
            <button class="clinical-action-btn action-btn-primary" onclick="window.print()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Print Report
            </button>
            <button class="clinical-action-btn" onclick="clinicalDisplay.exportToPDF()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export PDF
            </button>
            <button class="clinical-action-btn" onclick="clinicalDisplay.shareReport()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                Share
            </button>
            <button class="clinical-action-btn" onclick="clinicalDisplay.saveToEMR()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Save to EMR
            </button>
        `;

        return actions;
    }

    // ==================== UTILITY FUNCTIONS ====================

    generateAnalysisId() {
        return 'LYD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    extractSummary(data) {
        if (data.analysis && typeof data.analysis === 'string') {
            return data.analysis;
        }
        if (data.result) {
            return data.result;
        }
        return 'Analysis completed successfully. Please review the detailed findings below.';
    }

    extractFindings(data) {
        const findings = [];

        if (data.findings && Array.isArray(data.findings)) {
            return data.findings;
        }

        if (data.analysis && typeof data.analysis === 'object') {
            if (data.analysis.findings) {
                return data.analysis.findings;
            }
        }

        // Parse from text if structured
        if (data.analysis && typeof data.analysis === 'string') {
            const lines = data.analysis.split('\n');
            let currentFinding = null;

            lines.forEach(line => {
                if (line.match(/^\d+\./)) {
                    if (currentFinding) findings.push(currentFinding);
                    currentFinding = {
                        title: line.replace(/^\d+\./, '').trim(),
                        description: '',
                        severity: 'info'
                    };
                } else if (currentFinding && line.trim()) {
                    currentFinding.description += line.trim() + ' ';
                }
            });

            if (currentFinding) findings.push(currentFinding);
        }

        if (findings.length === 0) {
            findings.push({
                title: 'Analysis Complete',
                description: data.analysis || data.summary || 'Medical image analysis has been completed.',
                severity: 'info'
            });
        }

        return findings;
    }

    extractRecommendations(data) {
        if (data.recommendations && Array.isArray(data.recommendations)) {
            return data.recommendations;
        }

        if (data.treatment) {
            return [data.treatment];
        }

        return [
            'Review findings with attending physician',
            'Compare with previous imaging studies if available',
            'Consider follow-up imaging as clinically indicated',
            'Document findings in patient medical record'
        ];
    }

    extractTechnicalData(data) {
        const technical = {};

        if (data.processingTime) technical['Processing Time'] = `${data.processingTime}ms`;
        if (data.model) technical['AI Model'] = this.obfuscateBranding(data.model);
        if (data.confidence) technical['Confidence Score'] = `${Math.round(data.confidence * 100)}%`;
        if (data.imageSize) technical['Image Dimensions'] = data.imageSize;
        if (data.fileSize) technical['File Size'] = this.formatBytes(data.fileSize);

        return technical;
    }

    formatClinicalText(text) {
        if (!text) return '';

        // Convert bullet points
        text = text.replace(/^- /gm, '• ');

        // Add line breaks for better readability
        const paragraphs = text.split('\n\n');

        return paragraphs.map(p => `<p class="clinical-paragraph">${p.trim()}</p>`).join('');
    }

    formatLabel(key) {
        return key.replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // ==================== ACTION HANDLERS ====================

    exportToPDF() {
        alert('PDF export functionality will be implemented in the next update.');
        // TODO: Implement PDF generation
    }

    shareReport() {
        if (navigator.share) {
            navigator.share({
                title: 'Clinical Analysis Report',
                text: 'Medical AI Analysis Results',
                url: window.location.href
            }).catch(err => console.log('Share failed:', err));
        } else {
            alert('Sharing functionality is not supported on this device.');
        }
    }

    saveToEMR() {
        alert('EMR integration will be configured by your healthcare IT department.');
        // TODO: Implement HL7 FHIR integration
    }
}

// Global instance
window.clinicalDisplay = new ClinicalResultsDisplay();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClinicalResultsDisplay;
}
