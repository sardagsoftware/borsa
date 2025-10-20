/**
 * LyDian Medical AI - UI Components Module
 * Reusable UI components and modal management
 */

const MedicalUI = {
    // ============================================
    // SIDEBAR & NAVIGATION
    // ============================================
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const isCollapsed = sidebar.classList.contains('collapsed');

        if (isCollapsed) {
            sidebar.classList.remove('collapsed');
            sidebar.classList.add('active');
        } else {
            sidebar.classList.add('collapsed');
            sidebar.classList.remove('active');
        }

        window.MedicalState.ui.sidebarCollapsed = !isCollapsed;
        window.MedicalState.save();
    },

    toggleCategory(categoryId) {
        const category = document.querySelector(`[data-category="${categoryId}"]`)?.closest('.nav-category');
        if (category) {
            category.classList.toggle('open');
        }
    },

    setActiveSpecialization(specialization) {
        // Remove active from all items
        document.querySelectorAll('.specialization-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active to selected
        const activeItem = document.querySelector(`[data-specialization="${specialization}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Update state
        window.MedicalState.setSpecialization(specialization);

        // Update chat title
        const title = document.querySelector('.chat-title');
        if (title) {
            const specializationNames = {
                'general-medicine': 'General Medicine',
                'cardiology': 'Cardiology',
                'neurology': 'Neurology',
                'radiology': 'Radiology',
                'oncology': 'Oncology',
                'pediatrics': 'Pediatrics',
                'psychiatry': 'Psychiatry',
                'orthopedics': 'Orthopedics',
                'emergency-medicine': 'Emergency Medicine'
            };
            title.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/></svg> ${specializationNames[specialization] || 'Medical AI'}`;
        }
    },

    // ============================================
    // CHAT & MESSAGES
    // ============================================
    renderMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.role}`;
        messageEl.innerHTML = `
            <div class="message-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${message.role === 'user'
                        ? '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
                        : '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>'}
                </svg>
            </div>
            <div class="message-content">
                <div class="message-bubble">${this.escapeHtml(message.content)}</div>
                <div class="message-time">${this.formatTime(message.timestamp)}</div>
            </div>
        `;
        messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
        return messageEl;
    },

    showTypingIndicator() {
        const messagesContainer = document.getElementById('messagesContainer');
        const typingEl = document.createElement('div');
        typingEl.className = 'message ai';
        typingEl.id = 'typingIndicator';
        typingEl.innerHTML = `
            <div class="message-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingEl);
        this.scrollToBottom();
    },

    hideTypingIndicator() {
        const typingEl = document.getElementById('typingIndicator');
        if (typingEl) {
            typingEl.remove();
        }
    },

    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    },

    clearChat() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        window.MedicalState.clearMessages();
    },

    // ============================================
    // MODAL MANAGEMENT
    // ============================================
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            window.MedicalState.togglePanel(modalId.replace('Modal', ''), true);
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            window.MedicalState.togglePanel(modalId.replace('Modal', ''), false);
        }
    },

    closePanel(panelId, event) {
        if (event) {
            event.stopPropagation();
        }
        this.closeModal(panelId);
    },

    // ============================================
    // LOADING & FEEDBACK
    // ============================================
    showLoading(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #E5E7EB; border-top-color: #0066CC; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                    <p style="margin-top: 1rem; color: #6B7280;">${message}</p>
                </div>
            `;
            container.style.display = 'block';
        }
    },

    showError(containerId, errorMessage) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="background: #FEE2E2; border-left: 4px solid #EF4444; padding: 1rem; border-radius: 8px;">
                    <p style="color: #DC2626; font-weight: 600; margin-bottom: 0.5rem;">Error</p>
                    <p style="color: #7F1D1D; font-size: 0.875rem;">${this.escapeHtml(errorMessage)}</p>
                </div>
            `;
            container.style.display = 'block';
        }
    },

    showSuccess(containerId, successMessage) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="background: #D1FAE5; border-left: 4px solid #10B981; padding: 1rem; border-radius: 8px;">
                    <p style="color: #047857; font-weight: 600; margin-bottom: 0.5rem;">Success</p>
                    <p style="color: #065F46; font-size: 0.875rem;">${this.escapeHtml(successMessage)}</p>
                </div>
            `;
            container.style.display = 'block';
        }
    },

    // ============================================
    // NOTIFICATIONS
    // ============================================
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        const colors = {
            success: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
            error: { bg: '#FEE2E2', border: '#EF4444', text: '#7F1D1D' },
            warning: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
            info: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E3A8A' }
        };
        const color = colors[type] || colors.info;

        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color.bg};
            border-left: 4px solid ${color.border};
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            color: ${color.text};
            font-size: 0.875rem;
            z-index: 10000;
            animation: slideInLeft 0.3s ease;
            max-width: 400px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeInScale 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // ============================================
    // FILE UPLOAD
    // ============================================
    handleFileUpload(event, type = 'images') {
        const file = event.target.files[0];
        if (!file) return;

        // Add to state
        window.MedicalState.addUploadedFile(type, file);

        // Show feedback
        this.showToast(`File uploaded: ${file.name}`, 'success');

        return file;
    },

    // ============================================
    // TAB SWITCHING
    // ============================================
    switchTab(tabGroupId, tabId) {
        const tabGroup = document.querySelector(`#${tabGroupId}`);
        if (!tabGroup) return;

        // Hide all tabs
        tabGroup.querySelectorAll('[id$="Tab"]').forEach(tab => {
            tab.style.display = 'none';
        });

        // Reset all tab buttons
        tabGroup.querySelectorAll('[id^="tab"]').forEach(btn => {
            btn.style.background = '#F3F4F6';
            btn.style.color = '#6B7280';
        });

        // Show selected tab
        const selectedTab = document.getElementById(`${tabId}Tab`);
        const selectedBtn = document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);

        if (selectedTab) selectedTab.style.display = 'block';
        if (selectedBtn) {
            selectedBtn.style.background = 'linear-gradient(135deg, #0066CC, #00A3E0)';
            selectedBtn.style.color = 'white';
        }
    },

    // ============================================
    // UTILITIES
    // ============================================
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.MedicalUI = MedicalUI;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MedicalUI;
}
