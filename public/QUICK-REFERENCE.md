# LyDian Medical AI - Quick Reference Card

## File Structure
```
public/
├── medical-expert.html          # Main HTML (optimized)
├── css/
│   └── medical-expert.css       # All styles (19KB)
└── js/medical/
    ├── app.js                   # Entry point (15KB)
    ├── state-management.js      # State (4.4KB)
    ├── api-client.js            # APIs (9.6KB)
    ├── ui-components.js         # UI (12KB)
    ├── medical-tools.js         # Tools (17KB)
    ├── epic-fhir.js             # FHIR (9.5KB)
    └── pwa-manager.js           # PWA (9.7KB)
```

## Load Order (Important!)
```html
<!-- 1. CSS -->
<link rel="stylesheet" href="/css/medical-expert.css">

<!-- 2. JavaScript Modules (in this exact order) -->
<script src="/js/medical/state-management.js"></script>
<script src="/js/medical/api-client.js"></script>
<script src="/js/medical/ui-components.js"></script>
<script src="/js/medical/medical-tools.js"></script>
<script src="/js/medical/epic-fhir.js"></script>
<script src="/js/medical/pwa-manager.js"></script>
<script src="/js/medical/app.js"></script>
```

## Global Objects
```javascript
window.MedicalState     // State management
window.MedicalAPI       // API client
window.MedicalUI        // UI helpers
window.MedicalTools     // Medical calculators
window.EpicFHIR         // FHIR integration
window.PWAManager       // PWA features
```

## Common Tasks

### Send Chat Message
```javascript
const response = await MedicalAPI.sendChatMessage(message, 'cardiology');
const msg = MedicalState.addMessage('user', message);
MedicalUI.renderMessage(msg);
```

### Show Modal
```javascript
MedicalUI.openModal('emergencyModal');
MedicalUI.closeModal('emergencyModal');
```

### Show Notification
```javascript
MedicalUI.showToast('Success!', 'success', 3000);
// Types: 'success', 'error', 'warning', 'info'
```

### Show Loading
```javascript
MedicalUI.showLoading('resultId', 'Analyzing...');
MedicalUI.showError('resultId', 'Failed');
MedicalUI.showSuccess('resultId', 'Complete');
```

### Save State
```javascript
MedicalState.addMessage('user', 'Hello');
MedicalState.setSpecialization('cardiology');
MedicalState.save(); // Persists to localStorage
```

### API Call Pattern
```javascript
async function myTool() {
    try {
        MedicalUI.showLoading('results', 'Processing...');
        const data = await MedicalAPI.someEndpoint(params);
        // Render results
        document.getElementById('results').innerHTML = data.html;
    } catch (error) {
        MedicalUI.showError('results', error.message);
    }
}
```

### Calculate Risk
```javascript
// Framingham
await MedicalTools.calculateFraminghamRisk({
    age: 62, gender: 'male', cholesterol: 250,
    hdl: 45, systolicBP: 140, smoking: true
});

// CHADS2
await MedicalTools.calculateCHADS2Score({
    chf: true, hypertension: true, age75: false,
    diabetes: true, stroke: false
});
```

### Drug Interactions
```javascript
await MedicalTools.checkDrugInteractions([
    'Warfarin 5mg',
    'Ibuprofen 600mg',
    'Lisinopril 10mg'
]);
```

### Differential Diagnosis
```javascript
await MedicalTools.getDifferentialDiagnosis({
    chiefComplaint: 'chest pain',
    symptoms: ['chest pain', 'dyspnea', 'diaphoresis'],
    age: 62,
    sex: 'male',
    riskFactors: ['hypertension', 'diabetes']
});
```

### FHIR Integration
```javascript
// Connect
await EpicFHIR.connect({
    clientId: 'id',
    clientSecret: 'secret',
    fhirBaseURL: 'https://fhir.epic.com/...'
});

// Fetch patient
const patient = await EpicFHIR.fetchPatient('12345');
const conditions = await EpicFHIR.fetchConditions('12345');
const meds = await EpicFHIR.fetchMedications('12345');
```

### PWA Features
```javascript
// Initialize
await PWAManager.init();

// Install prompt
await PWAManager.promptInstall();

// Check online
if (PWAManager.isOnline()) {
    // ...
}

// Show notification
await PWAManager.showNotification('Title', {
    body: 'Message',
    icon: '/icon.png'
});
```

## HTML onclick Handlers
```html
<button onclick="sendMessage()">Send</button>
<button onclick="newConsultation()">New</button>
<button onclick="toggleCategory('specialties')">Toggle</button>
<button onclick="openPanel('emergencyModal')">Open</button>
<button onclick="closePanel('emergencyModal', event)">Close</button>
<button onclick="switchSpecialization('cardiology')">Switch</button>
<button onclick="diagnoseDifferential()">Diagnose</button>
<button onclick="checkInteractions()">Check</button>
```

## CSS Classes
```css
.sidebar                 /* Main sidebar */
.sidebar.collapsed       /* Hidden sidebar */
.main-chat              /* Chat area */
.message.user           /* User message */
.message.ai             /* AI message */
.modal                  /* Modal overlay */
.modal.active           /* Visible modal */
.specialization-item    /* Sidebar item */
.specialization-item.active  /* Active item */
```

## State Properties
```javascript
MedicalState.messages              // Chat history
MedicalState.currentSpecialization // Active specialty
MedicalState.hospitalSettings      // Settings object
MedicalState.currentPatient        // Patient data
MedicalState.ui.sidebarCollapsed   // UI state
MedicalState.uploadedFiles         // File uploads
```

## API Endpoints (Backend)
```
POST /api/medical/chat-azure-openai
POST /api/medical/image-analysis
POST /api/medical/dicom-api
POST /api/neuro/imaging-analysis
POST /api/neuro/health-index
POST /api/neuro/risk-assessment
POST /api/medical/cardiology-tools
POST /api/medical/oncology-tools
POST /api/medical/genomics/variant-interpretation
POST /api/medical/clinical-decision/differential-diagnosis
POST /api/medical/clinical-decision/treatment-protocol
POST /api/medical/clinical-decision/drug-interactions
POST /api/medical/fhir-api
POST /api/medical/speech-transcription
POST /api/medical/rag-search-api
```

## Event Listeners
```javascript
// Auto-setup by app.js on DOMContentLoaded:
- Sidebar toggle
- New consultation button
- Message input (Enter to send)
- Send button
- Voice button
- File upload button
- Emergency button
- User dropdown
- Specialization items
```

## localStorage Keys
```
medicalAI_state              // App state
medicalAI_hospitalSettings   // Settings
medicalAI_offline-queue      // Offline sync queue
```

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- iOS 14+
- Android 8+

## Performance Targets
- Load time: < 1s on 3G
- First paint: < 0.5s
- Time to interactive: < 2s
- Lighthouse score: 90+

## Security Notes
- Always use HTTPS
- Never expose API keys client-side
- Use OAuth 2.0 for FHIR
- Sanitize user input (escapeHtml)
- Enable audit logging
- Set session timeouts

## Debugging
```javascript
// Check state
console.log(window.MedicalState.getSnapshot());

// Check if modules loaded
console.log(window.MedicalState ? '✓' : '✗', 'State');
console.log(window.MedicalAPI ? '✓' : '✗', 'API');
console.log(window.MedicalUI ? '✓' : '✗', 'UI');

// Check service worker
navigator.serviceWorker.getRegistration().then(console.log);

// Check localStorage
console.log(localStorage.getItem('medicalAI_state'));
```

## Common Errors

### "MedicalState is not defined"
→ state-management.js not loaded or loaded after app.js

### "Cannot read property 'value' of null"
→ Element ID doesn't exist in HTML

### "API Error: 404"
→ Backend endpoint not implemented or wrong URL

### "CORS error"
→ Backend CORS headers not configured

### Service worker not registering
→ Not using HTTPS or sw.js file missing

## Production Checklist
- [ ] Minify CSS & JS
- [ ] Enable gzip/brotli
- [ ] Set cache headers
- [ ] Run Lighthouse audit
- [ ] Test offline mode
- [ ] Verify FHIR integration
- [ ] Test on mobile
- [ ] Enable error monitoring
- [ ] Set up analytics
- [ ] Configure CDN

## Useful Commands
```bash
# Check file sizes
ls -lh css/medical-expert.css js/medical/*.js

# Total bundle size
du -sh js/medical

# Minify CSS
npx cssnano css/medical-expert.css css/medical-expert.min.css

# Minify JS
npx terser js/medical/*.js -c -m -o js/bundle.min.js

# Start local server
python -m http.server 8000
# or
npx serve .
```

## Documentation Files
- `MEDICAL-EXPERT-OPTIMIZATION-GUIDE.md` - Complete guide
- `OPTIMIZATION-SUMMARY.md` - Project summary
- `QUICK-REFERENCE.md` - This file

## Version
- **Current:** 2.0.0
- **Date:** January 2025
- **Status:** Production Ready

## Contact
For support, review the comprehensive guide: `MEDICAL-EXPERT-OPTIMIZATION-GUIDE.md`

---
**Last Updated:** January 2025
