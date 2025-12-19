/**
 * LyDian Medical AI - Main Application Entry Point
 * Initializes all modules and handles core application logic
 */

// ============================================
// APPLICATION INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏥 LyDian Medical AI initializing...');

    // Initialize state management
    window.MedicalState.init();
    console.log('✓ State management initialized');

    // Initialize PWA features
    await PWAManager.init();
    console.log('✓ PWA features initialized');

    // Setup event listeners
    setupEventListeners();
    console.log('✓ Event listeners attached');

    // Load saved messages
    loadChatHistory();
    console.log('✓ Chat history loaded');

    // Initialize specializations
    initializeSpecializations();
    console.log('✓ Specializations loaded');

    console.log('✅ LyDian Medical AI ready!');
});

// ============================================
// EVENT LISTENERS SETUP
// ============================================
function setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => MedicalUI.toggleSidebar());
    }

    // New consultation button
    const newConsultationBtn = document.querySelector('.new-consultation-btn');
    if (newConsultationBtn) {
        newConsultationBtn.addEventListener('click', newConsultation);
    }

    // Message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = messageInput.scrollHeight + 'px';
        });
    }

    // Send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    // Voice input button
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', startVoiceInput);
    }

    // File upload button
    const fileBtn = document.getElementById('fileBtn');
    if (fileBtn) {
        fileBtn.addEventListener('click', () => {
            document.getElementById('fileInput')?.click();
        });
    }

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // Emergency button
    const emergencyBtn = document.querySelector('.emergency-btn');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', () => openPanel('emergencyModal'));
    }

    // User dropdown
    setupUserDropdown();
}

// ============================================
// CHAT FUNCTIONALITY
// ============================================
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput?.value.trim();

    if (!message) return;

    // Disable send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.disabled = true;

    // Add user message to UI
    const userMessage = window.MedicalState.addMessage('user', message);
    MedicalUI.renderMessage(userMessage);

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Show typing indicator
    MedicalUI.showTypingIndicator();

    try {
        // Send to API
        const response = await MedicalAPI.sendChatMessage(
            message,
            window.MedicalState.currentSpecialization
        );

        // Hide typing indicator
        MedicalUI.hideTypingIndicator();

        // Add AI response
        if (response.success) {
            const aiMessage = window.MedicalState.addMessage('ai', response.message, {
                model: response.model,
                tokens: response.usage
            });
            MedicalUI.renderMessage(aiMessage);
        } else {
            throw new Error(response.error || 'Failed to get response');
        }
    } catch (error) {
        MedicalUI.hideTypingIndicator();
        console.error('Chat error:', error);
        MedicalUI.showToast('Failed to send message: ' + error.message, 'error');
    } finally {
        // Re-enable send button
        if (sendBtn) sendBtn.disabled = false;
    }
}

function newConsultation() {
    if (confirm('Start a new consultation? Current chat will be cleared.')) {
        MedicalUI.clearChat();
        MedicalUI.showToast('New consultation started', 'success');
    }
}

function loadChatHistory() {
    const messages = window.MedicalState.messages;
    const messagesContainer = document.getElementById('messagesContainer');

    if (!messagesContainer) return;

    if (messages.length === 0) {
        // Show empty state
        messagesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
                    </svg>
                </div>
                <h2 class="empty-title">Welcome to LyDian Medical AI</h2>
                <p class="empty-subtitle">How can I assist you today?</p>
            </div>
        `;
    } else {
        messagesContainer.innerHTML = '';
        messages.forEach(msg => MedicalUI.renderMessage(msg));
    }
}

// ============================================
// VOICE INPUT
// ============================================
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        MedicalUI.showToast('Speech recognition not supported', 'error');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = window.MedicalState.hospitalSettings.language || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.style.background = '#EF4444';
            voiceBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>';
        }
        MedicalUI.showToast('Listening...', 'info', 1000);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.value = transcript;
            messageInput.focus();
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        MedicalUI.showToast('Voice input failed', 'error');
    };

    recognition.onend = () => {
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.style.background = '';
            voiceBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
        }
    };

    recognition.start();
}

// ============================================
// FILE UPLOAD
// ============================================
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Add to state
    window.MedicalState.addUploadedFile('images', file);

    // Show preview
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value += `\n[Uploaded: ${file.name}]`;
    }

    MedicalUI.showToast(`File uploaded: ${file.name}`, 'success');
}

// ============================================
// SPECIALIZATION MANAGEMENT
// ============================================
function initializeSpecializations() {
    const specializationItems = document.querySelectorAll('.specialization-item');

    specializationItems.forEach(item => {
        item.addEventListener('click', () => {
            const specialization = item.dataset.specialization;
            if (specialization) {
                switchSpecialization(specialization);
            }
        });
    });

    // Set initial active state
    const currentSpec = window.MedicalState.currentSpecialization || 'general-medicine';
    MedicalUI.setActiveSpecialization(currentSpec);
}

function switchSpecialization(specialization) {
    MedicalUI.setActiveSpecialization(specialization);
    MedicalUI.showToast(`Switched to ${specialization.replace('-', ' ')}`, 'success');
}

// ============================================
// NAVIGATION CATEGORY TOGGLE
// ============================================
function toggleCategory(categoryId) {
    MedicalUI.toggleCategory(categoryId);
}

// ============================================
// PANEL/MODAL MANAGEMENT
// ============================================
function openPanel(panelId) {
    MedicalUI.openModal(panelId);
}

function closePanel(panelId, event) {
    MedicalUI.closePanel(panelId, event);
}

// ============================================
// USER DROPDOWN
// ============================================
function setupUserDropdown() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = userDropdown.style.display === 'block';
            userDropdown.style.display = isVisible ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.style.display = 'none';
            }
        });
    }
}

function showPatientHistory() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) userDropdown.style.display = 'none';

    MedicalUI.openModal('patientHistoryModal');
}

function showHospitalSettings() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) userDropdown.style.display = 'none';

    MedicalUI.openModal('hospitalSettingsModal');
}

function logoutHospital() {
    if (confirm('Are you sure you want to sign out?')) {
        window.MedicalState.reset();
        MedicalUI.showToast('Signed out successfully', 'success');
        setTimeout(() => {
            window.location.href = '/auth.html';
        }, 1000);
    }
}

// ============================================
// TAB SWITCHING (for modals)
// ============================================
function switchCDSSTab(tab) {
    const tabs = {
        differential: { id: 'differentialDxTab', color: '#0066CC' },
        treatment: { id: 'treatmentProtocolTab', color: '#10B981' },
        interactions: { id: 'drugInteractionsTab', color: '#F59E0B' }
    };

    // Hide all tabs
    Object.values(tabs).forEach(t => {
        const tabEl = document.getElementById(t.id);
        if (tabEl) tabEl.style.display = 'none';
    });

    // Reset all buttons
    ['tabDifferentialDx', 'tabTreatmentProtocol', 'tabDrugInteractions'].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.style.background = '#F3F4F6';
            btn.style.color = '#6B7280';
        }
    });

    // Show selected tab
    const selectedTab = tabs[tab];
    if (selectedTab) {
        const tabEl = document.getElementById(selectedTab.id);
        const btnEl = document.getElementById('tab' + selectedTab.id.replace('Tab', '').replace(/([A-Z])/g, '$1'));

        if (tabEl) tabEl.style.display = 'block';
        if (btnEl) {
            btnEl.style.background = `linear-gradient(135deg, ${selectedTab.color}, ${selectedTab.color}dd)`;
            btnEl.style.color = 'white';
        }
    }
}

// Similar functions for other tab groups
function switchOncoTab(tab) {
    MedicalUI.switchTab('oncologyModal', tab);
}

function switchGenomicsTab(tab) {
    MedicalUI.switchTab('genomicsModal', tab);
}

// ============================================
// MEDICAL TOOLS WRAPPERS
// ============================================
// These functions are called from HTML onclick handlers

// Differential Diagnosis
async function diagnoseDifferential() {
    const data = {
        chiefComplaint: document.getElementById('chiefComplaint')?.value,
        symptoms: document.getElementById('symptoms')?.value.split(',').map(s => s.trim()),
        age: parseInt(document.getElementById('patientAge')?.value),
        sex: document.getElementById('patientSex')?.value,
        riskFactors: document.getElementById('riskFactors')?.value.split(',').map(s => s.trim())
    };

    await MedicalTools.getDifferentialDiagnosis(data);
}

// Drug Interactions
async function checkInteractions() {
    const medicationsStr = document.getElementById('medications')?.value;
    const medications = medicationsStr.split(/[\n,]/).map(m => m.trim()).filter(m => m);

    await MedicalTools.checkDrugInteractions(medications);
}

// Variant Interpretation
async function interpretVariant() {
    const data = {
        gene: document.getElementById('variantGene')?.value,
        variant: document.getElementById('variantHGVS')?.value,
        age: parseInt(document.getElementById('variantAge')?.value),
        sex: document.getElementById('variantSex')?.value,
        familyHistory: document.getElementById('variantFamilyHistory')?.value
    };

    await MedicalTools.interpretVariant(data);
}

// Pharmacogenomics
async function analyzePharmacogenomics() {
    const data = {
        gene: document.getElementById('pharmacogene')?.value,
        phenotype: document.getElementById('metabolizerPhenotype')?.value,
        medications: document.getElementById('currentMedications')?.value.split(',').map(m => m.trim())
    };

    await MedicalTools.analyzePharmacogenomics(data);
}

// ============================================
// UTILITIES
// ============================================
function escapeHtml(text) {
    return MedicalUI.escapeHtml(text);
}

// Make functions globally available
window.sendMessage = sendMessage;
window.newConsultation = newConsultation;
window.startVoiceInput = startVoiceInput;
window.toggleCategory = toggleCategory;
window.openPanel = openPanel;
window.closePanel = closePanel;
window.showPatientHistory = showPatientHistory;
window.showHospitalSettings = showHospitalSettings;
window.logoutHospital = logoutHospital;
window.switchCDSSTab = switchCDSSTab;
window.switchOncoTab = switchOncoTab;
window.switchGenomicsTab = switchGenomicsTab;
window.diagnoseDifferential = diagnoseDifferential;
window.checkInteractions = checkInteractions;
window.interpretVariant = interpretVariant;
window.analyzePharmacogenomics = analyzePharmacogenomics;
window.switchSpecialization = switchSpecialization;

console.log('✅ LyDian Medical AI app.js loaded');
