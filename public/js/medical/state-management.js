/**
 * LyDian Medical AI - State Management Module
 * Centralized state management for the medical expert system
 */

const MedicalState = {
    // User & Session
    currentUser: null,
    sessionId: null,

    // Chat State
    messages: [],
    currentSpecialization: 'general-medicine',
    isTyping: false,

    // Medical Tools State
    uploadedFiles: {
        images: [],
        documents: [],
        labResults: []
    },

    // Active Panels
    activePanels: {
        emergency: false,
        patientHistory: false,
        hospitalSettings: false,
        medicalTools: false
    },

    // Hospital Settings
    hospitalSettings: {
        hospitalName: '',
        department: 'general-medicine',
        language: 'en',
        aiTemperature: 0.3,
        maxTokens: 800,
        enableAudit: true,
        emergencyAlert: true
    },

    // Patient Context
    currentPatient: {
        id: null,
        age: null,
        gender: null,
        history: [],
        allergies: [],
        currentMedications: []
    },

    // UI State
    ui: {
        sidebarCollapsed: false,
        theme: 'light',
        fontSize: 'medium'
    },

    // Initialize state from localStorage
    init() {
        try {
            const saved = localStorage.getItem('medicalAI_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(this, parsed);
            }

            // Load hospital settings separately
            const settings = localStorage.getItem('medicalAI_hospitalSettings');
            if (settings) {
                this.hospitalSettings = JSON.parse(settings);
            }
        } catch (error) {
            console.error('State initialization error:', error);
        }

        return this;
    },

    // Save state to localStorage
    save() {
        try {
            const stateToSave = {
                messages: this.messages,
                currentSpecialization: this.currentSpecialization,
                uploadedFiles: this.uploadedFiles,
                ui: this.ui
            };
            localStorage.setItem('medicalAI_state', JSON.stringify(stateToSave));
            localStorage.setItem('medicalAI_hospitalSettings', JSON.stringify(this.hospitalSettings));
        } catch (error) {
            console.error('State save error:', error);
        }
    },

    // Add message to chat
    addMessage(role, content, metadata = {}) {
        const message = {
            id: Date.now(),
            role, // 'user' or 'ai'
            content,
            timestamp: new Date().toISOString(),
            metadata
        };
        this.messages.push(message);
        this.save();
        return message;
    },

    // Clear chat history
    clearMessages() {
        this.messages = [];
        this.save();
    },

    // Update current specialization
    setSpecialization(specialization) {
        this.currentSpecialization = specialization;
        this.save();
    },

    // Toggle panel visibility
    togglePanel(panelName, state = null) {
        if (state !== null) {
            this.activePanels[panelName] = state;
        } else {
            this.activePanels[panelName] = !this.activePanels[panelName];
        }
    },

    // Update hospital settings
    updateSettings(newSettings) {
        Object.assign(this.hospitalSettings, newSettings);
        this.save();
    },

    // File upload management
    addUploadedFile(type, file) {
        if (!this.uploadedFiles[type]) {
            this.uploadedFiles[type] = [];
        }
        this.uploadedFiles[type].push({
            id: Date.now(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
        });
        this.save();
    },

    // Get state snapshot
    getSnapshot() {
        return {
            ...this,
            timestamp: new Date().toISOString()
        };
    },

    // Reset state
    reset() {
        this.messages = [];
        this.uploadedFiles = { images: [], documents: [], labResults: [] };
        this.currentPatient = { id: null, age: null, gender: null, history: [], allergies: [], currentMedications: [] };
        this.save();
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.MedicalState = MedicalState.init();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MedicalState;
}
