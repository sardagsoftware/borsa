/**
 * LyDian IQ Voice Module
 * - Ses → Metin (Web Speech API)
 * - Metin → Ses (Azure Neural Voice - Bayan)
 * - Pause/Resume Control
 */

(function() {
    'use strict';

    // Voice state
    const voiceState = {
        isListening: false,
        isSpeaking: false,
        currentAudio: null,
        recognition: null
    };

    // Initialize when DOM ready
    function initVoiceFeatures() {
        const voiceBtn = document.getElementById('voiceBtn');
        if (!voiceBtn) {
            console.warn('⚠️ Voice button not found');
            return;
        }

        // Initialize Speech Recognition (Ses → Metin)
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            voiceState.recognition = new SpeechRecognition();
            voiceState.recognition.lang = 'tr-TR';
            voiceState.recognition.continuous = false;
            voiceState.recognition.interimResults = true;

            // Voice button click handler
            voiceBtn.addEventListener('click', toggleVoiceSearch);

            // Recognition events
            voiceState.recognition.onstart = () => {
                console.log('🎤 Voice search started');
                voiceBtn.classList.add('listening');
                voiceBtn.style.animation = 'pulse-voice 1.5s infinite';
            };

            voiceState.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = transcript;
                    console.log('🎤 Recognized:', transcript);
                }
            };

            voiceState.recognition.onend = () => {
                console.log('🎤 Voice search ended');
                voiceBtn.classList.remove('listening');
                voiceBtn.style.animation = '';
                voiceState.isListening = false;
            };

            voiceState.recognition.onerror = (event) => {
                console.error('❌ Voice recognition error:', event.error);
                voiceBtn.classList.remove('listening');
                voiceBtn.style.animation = '';
                voiceState.isListening = false;
            };

            console.log('✅ Voice Search (STT) initialized');
        } else {
            console.warn('⚠️ Speech Recognition not supported in this browser');
            voiceBtn.title = 'Tarayıcınız sesli arama desteklemiyor';
        }

        // Add speaker button to responses (will be triggered after response display)
        addSpeakerButtonToResponses();
    }

    // Toggle voice search
    function toggleVoiceSearch() {
        if (!voiceState.recognition) return;

        if (voiceState.isListening) {
            voiceState.recognition.stop();
            voiceState.isListening = false;
        } else {
            voiceState.recognition.start();
            voiceState.isListening = true;
        }
    }

    // Text-to-Speech using Azure
    async function speakText(text) {
        if (voiceState.isSpeaking) {
            // Stop current speech
            if (voiceState.currentAudio) {
                voiceState.currentAudio.pause();
                voiceState.currentAudio = null;
            }
            voiceState.isSpeaking = false;
            return;
        }

        try {
            console.log('🔊 Requesting TTS from Azure...');

            // Limit text length
            const textToSpeak = text.substring(0, 500);

            const response = await fetch('/api/azure-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'text-to-speech',
                    text: textToSpeak
                })
            });

            if (!response.ok) {
                throw new Error(`TTS API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.audio) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
                voiceState.currentAudio = audio;
                voiceState.isSpeaking = true;

                audio.onended = () => {
                    voiceState.isSpeaking = false;
                    voiceState.currentAudio = null;
                    console.log('🔊 TTS playback ended');
                };

                audio.onerror = (error) => {
                    console.error('❌ Audio playback error:', error);
                    voiceState.isSpeaking = false;
                    voiceState.currentAudio = null;
                };

                console.log(`🔊 Playing TTS (${data.voice})`);
                await audio.play();
            }
        } catch (error) {
            console.error('❌ TTS Error:', error);
            voiceState.isSpeaking = false;
        }
    }

    // Add speaker button to response area
    function addSpeakerButtonToResponses() {
        // Observer to detect when response is displayed
        const responseContent = document.getElementById('responseContent');
        if (!responseContent) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Response added, add speaker button
                    addSpeakerButton(responseContent);
                }
            });
        });

        observer.observe(responseContent, {
            childList: true,
            subtree: false
        });
    }

    // Create and add speaker button
    function addSpeakerButton(container) {
        // Remove old speaker button
        const oldBtn = container.querySelector('.speaker-btn');
        if (oldBtn) oldBtn.remove();

        // Create speaker button
        const speakerBtn = document.createElement('button');
        speakerBtn.className = 'speaker-btn';
        speakerBtn.title = 'Sesli okuma (Bayan ses)';
        speakerBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
        `;

        speakerBtn.addEventListener('click', () => {
            const responseText = container.textContent || container.innerText;
            // Remove button text from speech
            const cleanText = responseText.replace(/🤖|⚡|🛡️|LyDian IQ|Ultra Intelligence|Enterprise AI|Secure & Encrypted|White-Hat Rules|Active/g, '').trim();
            speakText(cleanText);
        });

        // Insert at top-right
        speakerBtn.style.cssText = `
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: var(--glass, rgba(255,255,255,0.1));
            backdrop-filter: blur(10px);
            border: 1px solid var(--border, rgba(255,255,255,0.1));
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 10;
            color: var(--primary, #DAA520);
        `;

        container.style.position = 'relative';
        container.insertBefore(speakerBtn, container.firstChild);

        console.log('🔊 Speaker button added');
    }

    // Add CSS for voice animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse-voice {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7);
            }
            50% {
                transform: scale(1.05);
                box-shadow: 0 0 0 10px rgba(255, 68, 68, 0);
            }
        }

        .speaker-btn:hover {
            background: var(--primary, #DAA520) !important;
            transform: scale(1.1);
        }

        .speaker-btn.speaking {
            animation: pulse-speaker 1s infinite;
        }

        @keyframes pulse-speaker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVoiceFeatures);
    } else {
        initVoiceFeatures();
    }

    // Export for debugging
    window.LyDianVoice = {
        speak: speakText,
        toggleSearch: toggleVoiceSearch,
        state: voiceState
    };

    console.log('🎤 LyDian Voice Module Loaded');
    console.log('✅ Features: Voice Search (Bayan ses), Text-to-Speech (Azure)');
})();
