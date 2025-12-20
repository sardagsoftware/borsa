/**
 * ============================================
 * PREMIUM NESTED DROPDOWN MENU SYSTEM
 * ============================================
 * Modern, compact, animated menu with nested dropdowns
 * Apple/Vercel style design
 * ============================================
 */

class PremiumNestedMenu {
  constructor() {
    this.activeDropdown = null;
    this.init();
  }

  init() {
    this.createMenuStructure();
    this.attachEventListeners();
    this.initAnimations();
  }

  createMenuStructure() {
    const menuContainer = document.querySelector('.specializations-list') ||
                         document.querySelector('.sidebar-menu') ||
                         document.querySelector('#sidebarMenu');

    if (!menuContainer) {
      console.warn('Menu container not found');
      return;
    }

    // Modern compact menu structure - ENGLISH MENUS
    const menuHTML = `
      <!-- 🏥 Medical Specialties -->
      <div class="menu-section">
        <div class="menu-category" data-category="medical">
          <div class="menu-category-header">
            <span class="category-icon">🏥</span>
            <span class="category-title">Medical AI</span>
            <span class="category-arrow">›</span>
          </div>
          <div class="menu-category-dropdown">
            <div class="menu-item" data-page="general">
              <span class="item-icon">🩺</span>
              <span>General Diagnosis</span>
            </div>
            <div class="menu-item" data-page="cardiology">
              <span class="item-icon">❤️</span>
              <span>Cardiology</span>
            </div>
            <div class="menu-item" data-page="neurology">
              <span class="item-icon">🧠</span>
              <span>Neurology</span>
            </div>
            <div class="menu-item" data-page="oncology">
              <span class="item-icon">🎗️</span>
              <span>Oncology</span>
            </div>

            <!-- 🇺🇸 USA Early Diagnosis - NEW! -->
            <div class="menu-item menu-item-featured" data-page="usa-diagnosis">
              <span class="item-icon">🇺🇸</span>
              <div class="item-content">
                <span class="item-title">USA Early Diagnosis</span>
                <span class="item-badge">NEW</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 🔬 Advanced Features -->
        <div class="menu-category" data-category="advanced">
          <div class="menu-category-header">
            <span class="category-icon">🔬</span>
            <span class="category-title">Advanced</span>
            <span class="category-arrow">›</span>
          </div>
          <div class="menu-category-dropdown">
            <div class="menu-item" data-page="lab-analysis">
              <span class="item-icon">📊</span>
              <span>Lab Analysis</span>
            </div>
            <div class="menu-item" data-page="imaging">
              <span class="item-icon">📸</span>
              <span>Medical Imaging</span>
            </div>
            <div class="menu-item" data-page="rag-radiology">
              <span class="item-icon">🔍</span>
              <div class="item-content">
                <span class="item-title">RAG Radiology Analysis</span>
                <span class="item-badge">NEW</span>
              </div>
            </div>
            <div class="menu-item" data-page="drug-interaction">
              <span class="item-icon">💊</span>
              <span>Drug Interactions</span>
            </div>
          </div>
        </div>

        <!-- 📚 Knowledge Base -->
        <div class="menu-category" data-category="knowledge">
          <div class="menu-category-header">
            <span class="category-icon">📚</span>
            <span class="category-title">Knowledge</span>
            <span class="category-arrow">›</span>
          </div>
          <div class="menu-category-dropdown">
            <div class="menu-item" data-page="guidelines">
              <span class="item-icon">📋</span>
              <span>Clinical Guidelines</span>
            </div>
            <div class="menu-item" data-page="research">
              <span class="item-icon">🔍</span>
              <span>Research Papers</span>
            </div>
            <div class="menu-item" data-page="trials">
              <span class="item-icon">🧬</span>
              <span>Clinical Trials</span>
            </div>
          </div>
        </div>

        <!-- ⚙️ Settings -->
        <div class="menu-category" data-category="settings">
          <div class="menu-category-header">
            <span class="category-icon">⚙️</span>
            <span class="category-title">Settings</span>
            <span class="category-arrow">›</span>
          </div>
          <div class="menu-category-dropdown">
            <div class="menu-item" data-page="profile">
              <span class="item-icon">👤</span>
              <span>Profile</span>
            </div>
            <div class="menu-item" data-page="preferences">
              <span class="item-icon">🎨</span>
              <span>Preferences</span>
            </div>
            <div class="menu-item" data-page="security">
              <span class="item-icon">🔐</span>
              <span>Security</span>
            </div>
          </div>
        </div>
      </div>
    `;

    menuContainer.innerHTML = menuHTML;
  }

  attachEventListeners() {
    // Category header clicks
    document.querySelectorAll('.menu-category-header').forEach(header => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const category = header.closest('.menu-category');
        this.toggleCategory(category);
      });
    });

    // Menu item clicks
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const page = item.dataset.page;
        this.navigateToPage(page);
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.closeAllCategories();
    });
  }

  toggleCategory(category) {
    const isOpen = category.classList.contains('open');

    // Close all other categories
    document.querySelectorAll('.menu-category.open').forEach(cat => {
      if (cat !== category) {
        cat.classList.remove('open');
      }
    });

    // Toggle current category
    if (isOpen) {
      category.classList.remove('open');
    } else {
      category.classList.add('open');
    }
  }

  closeAllCategories() {
    document.querySelectorAll('.menu-category.open').forEach(cat => {
      cat.classList.remove('open');
    });
  }

  navigateToPage(page) {
    console.log(`Navigating to: ${page}`);

    // Handle USA Diagnosis page
    if (page === 'usa-diagnosis') {
      this.loadUSADiagnosis();
      return;
    }

    // Handle RAG Radiology page
    if (page === 'rag-radiology') {
      this.loadRAGRadiology();
      return;
    }

    // Handle other pages
    this.loadPage(page);
  }

  loadUSADiagnosis() {
    // Show USA Early Diagnosis panel
    const mainContent = document.querySelector('.main-content') ||
                       document.querySelector('#mainContent');

    if (!mainContent) return;

    mainContent.innerHTML = `
      <div class="usa-diagnosis-panel">
        <div class="panel-header">
          <h1>🇺🇸 USA Early Diagnosis System</h1>
          <p class="panel-subtitle">State-specific disease risk analysis powered by CDC, Mayo Clinic, and NIH</p>
        </div>

        <div class="diagnosis-grid">
          <!-- State Selection -->
          <div class="diagnosis-card">
            <div class="card-icon">🗺️</div>
            <h3>Select State</h3>
            <select class="state-selector" id="stateSelector">
              <option value="">Choose your state...</option>
              <option value="Alabama">Alabama</option>
              <option value="Alaska">Alaska</option>
              <option value="Arizona">Arizona</option>
              <option value="Arkansas">Arkansas</option>
              <option value="California">California</option>
              <option value="Colorado">Colorado</option>
              <option value="Florida">Florida</option>
              <option value="Louisiana">Louisiana</option>
              <option value="Massachusetts">Massachusetts</option>
              <option value="Michigan">Michigan</option>
              <option value="New York">New York</option>
              <option value="Texas">Texas</option>
              <option value="Washington">Washington</option>
              <!-- Add all 50 states -->
            </select>
          </div>

          <!-- Symptoms Input -->
          <div class="diagnosis-card">
            <div class="card-icon">📝</div>
            <h3>Symptoms</h3>
            <textarea class="symptoms-input" placeholder="Describe your symptoms..."></textarea>
          </div>

          <!-- Patient Info -->
          <div class="diagnosis-card">
            <div class="card-icon">👤</div>
            <h3>Patient Info</h3>
            <div class="form-group">
              <label>Age</label>
              <input type="number" class="form-input" id="patientAge" placeholder="Age">
            </div>
            <div class="form-group">
              <label>Gender</label>
              <select class="form-input" id="patientGender">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <button class="analyze-btn" onclick="window.premiumMenu.runUSAAnalysis()">
          <span class="btn-icon">🔬</span>
          Run Comprehensive Analysis
        </button>

        <div class="results-container" id="diagnosisResults" style="display: none;">
          <!-- Results will be displayed here -->
        </div>
      </div>
    `;

    // Initialize state-specific features
    this.initUSADiagnosisFeatures();
  }

  async runUSAAnalysis() {
    const state = document.getElementById('stateSelector').value;
    const symptoms = document.querySelector('.symptoms-input').value;
    const age = document.getElementById('patientAge').value;
    const gender = document.getElementById('patientGender').value;

    if (!state || !symptoms) {
      alert('Please select a state and enter symptoms');
      return;
    }

    // Show loading
    const resultsContainer = document.getElementById('diagnosisResults');
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Analyzing with CDC, Mayo Clinic, and NIH data...</p>
      </div>
    `;

    try {
      // Call USA Diagnosis API
      const response = await fetch('/api/medical/usa-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'COMPREHENSIVE_ANALYSIS',
          patientData: {
            state,
            symptoms: symptoms.split(',').map(s => s.trim()),
            age: parseInt(age),
            gender,
            chiefComplaint: symptoms,
            id: 'temp-' + Date.now()
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        this.displayUSAResults(data.result);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('USA Diagnosis Error:', error);
      resultsContainer.innerHTML = `
        <div class="error-state">
          <p>❌ Error: ${error.message}</p>
          <p>Please try again or contact support.</p>
        </div>
      `;
    }
  }

  displayUSAResults(results) {
    const resultsContainer = document.getElementById('diagnosisResults');

    resultsContainer.innerHTML = `
      <div class="results-panels">
        <!-- Overall Risk Score -->
        <div class="result-card risk-card">
          <h3>📊 Overall Risk Score</h3>
          <div class="risk-score" style="color: ${this.getRiskColor(results.overallRiskScore)}">
            ${results.overallRiskScore}/100
          </div>
          <div class="urgency-badge urgency-${results.urgencyLevel.level.toLowerCase()}">
            ${results.urgencyLevel.level}: ${results.urgencyLevel.action}
          </div>
        </div>

        <!-- State-Specific Risks -->
        <div class="result-card">
          <h3>🗺️ ${results.stateSpecificRisks.state} Health Risks</h3>
          <ul class="risk-list">
            ${results.stateSpecificRisks.highRiskConditions?.map(condition =>
              `<li>${condition}</li>`
            ).join('') || '<li>No specific risks found</li>'}
          </ul>
          <h4>Recommended Screening:</h4>
          <ul class="screening-list">
            ${results.stateSpecificRisks.recommendedScreening?.map(screening =>
              `<li>${screening}</li>`
            ).join('') || '<li>Follow standard USPSTF guidelines</li>'}
          </ul>
        </div>

        <!-- CDC Early Warnings -->
        ${results.cdcEarlyWarning.totalMatches > 0 ? `
          <div class="result-card warning-card">
            <h3>⚠️ CDC Early Warning Signals</h3>
            <p class="warning-urgency">${results.cdcEarlyWarning.highestUrgency}</p>
            ${results.cdcEarlyWarning.conditions.map(condition => `
              <div class="warning-item">
                <h4>${condition.condition}</h4>
                <p><strong>Match Type:</strong> ${condition.matchType}</p>
                <p><strong>Action:</strong> ${condition.recommendedAction}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Next Steps -->
        <div class="result-card action-card">
          <h3>📋 Next Steps</h3>
          <ol class="action-list">
            ${results.nextSteps.map(step => `
              <li>
                <strong>${step.action}</strong>
                <span class="step-urgency">(${step.urgency})</span>
                <p>${step.reason}</p>
              </li>
            `).join('')}
          </ol>
        </div>

        <!-- Recommendations -->
        <div class="result-card">
          <h3>💡 Actionable Recommendations</h3>
          ${results.actionableRecommendations.slice(0, 5).map(rec => `
            <div class="recommendation-item">
              <span class="rec-category">${rec.category}</span>
              <p>${rec.action}</p>
              <small>Source: ${rec.source}</small>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="disclaimer">
        ⚠️ ${results.disclaimer}
      </div>
    `;
  }

  getRiskColor(score) {
    if (score < 30) return '#27AE60'; // Green
    if (score < 60) return '#F39C12'; // Orange
    return '#E74C3C'; // Red
  }

  initUSADiagnosisFeatures() {
    // Auto-populate based on geolocation (if available)
    if (navigator.geolocation) {
      // Could use geolocation API to auto-select state
    }
  }

  loadRAGRadiology() {
    const mainContent = document.querySelector('.main-content') ||
                       document.querySelector('#mainContent');

    if (!mainContent) return;

    mainContent.innerHTML = `
      <div class="rag-radiology-panel">
        <div class="panel-header">
          <h1>🔍 RAG-Powered Radiology Analysis</h1>
          <p class="panel-subtitle">Advanced AI medical imaging analysis - Catches details that might be missed</p>
        </div>

        <div class="upload-section">
          <div class="upload-card">
            <div class="upload-icon">📸</div>
            <h3>Upload Radiology Image</h3>
            <p class="upload-instructions">Upload X-Ray, CT, MRI or other medical images</p>

            <div class="file-upload-area" id="radiologyUploadArea">
              <input type="file" id="radiologyImageInput" accept="image/*" style="display: none;">
              <div class="upload-placeholder">
                <span class="upload-icon-large">📂</span>
                <p>Drag and drop image or click to select</p>
                <p class="upload-note">Supported formats: JPG, PNG, DICOM</p>
              </div>
              <div class="image-preview" id="imagePreview" style="display: none;">
                <img id="previewImage" src="" alt="Preview">
              </div>
            </div>

            <div class="clinical-context">
              <h4>Clinical Context</h4>

              <div class="form-group">
                <label>Image Type</label>
                <select class="form-input" id="imageType">
                  <option value="chest-xray">Chest X-Ray</option>
                  <option value="ct-scan">CT Scan</option>
                  <option value="mri">MRI</option>
                  <option value="mammography">Mammography</option>
                  <option value="ultrasound">Ultrasound</option>
                </select>
              </div>

              <div class="form-group">
                <label>Body Part</label>
                <input type="text" class="form-input" id="bodyPart" placeholder="e.g., Lung, Brain, Abdomen">
              </div>

              <div class="form-group">
                <label>View</label>
                <input type="text" class="form-input" id="imageView" placeholder="e.g., AP, Lateral, Axial">
              </div>

              <div class="form-group">
                <label>Patient Age</label>
                <input type="number" class="form-input" id="patientAge" placeholder="Age">
              </div>

              <div class="form-group">
                <label>Clinical History</label>
                <textarea class="form-input" id="clinicalHistory" rows="3" placeholder="Patient complaints, symptoms and previous medical history"></textarea>
              </div>
            </div>

            <button class="analyze-btn-primary" id="analyzeBtn" onclick="window.premiumMenu.analyzeRadiologyImage()">
              <span class="btn-icon">🔬</span>
              Start RAG Analysis
            </button>
          </div>
        </div>

        <div class="results-container" id="radiologyResults" style="display: none;">
          <!-- Analysis results will be displayed here -->
        </div>
      </div>
    `;

    // Setup file upload handlers
    this.setupRadiologyUpload();
  }

  setupRadiologyUpload() {
    const uploadArea = document.getElementById('radiologyUploadArea');
    const fileInput = document.getElementById('radiologyImageInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const placeholder = uploadArea.querySelector('.upload-placeholder');

    // Click to upload
    uploadArea.addEventListener('click', (e) => {
      if (!e.target.closest('.image-preview')) {
        fileInput.click();
      }
    });

    // File selection
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleRadiologyFile(file, previewImage, imagePreview, placeholder);
      }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.handleRadiologyFile(file, previewImage, imagePreview, placeholder);
      }
    });
  }

  handleRadiologyFile(file, previewImage, imagePreview, placeholder) {
    const reader = new FileReader();

    reader.onload = (e) => {
      previewImage.src = e.target.result;
      imagePreview.style.display = 'block';
      placeholder.style.display = 'none';

      // Store for analysis
      window.radiologyImageData = {
        base64: e.target.result.split(',')[1],
        mediaType: file.type,
        filename: file.name
      };
    };

    reader.readAsDataURL(file);
  }

  async analyzeRadiologyImage() {
    if (!window.radiologyImageData) {
      alert('Please upload an image first');
      return;
    }

    const imageType = document.getElementById('imageType').value;
    const bodyPart = document.getElementById('bodyPart').value;
    const view = document.getElementById('imageView').value;
    const age = document.getElementById('patientAge').value;
    const history = document.getElementById('clinicalHistory').value;

    const resultsContainer = document.getElementById('radiologyResults');
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Performing RAG-powered analysis...</p>
        <p class="loading-detail">Scanning medical literature, detecting early findings...</p>
      </div>
    `;

    try {
      const response = await fetch('/api/medical/rag-radiology-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'ANALYZE_IMAGE',
          imageData: window.radiologyImageData,
          clinicalContext: {
            imageType,
            bodyPart,
            view,
            age: parseInt(age) || null,
            history,
            imageId: `img-${Date.now()}`,
            doctorId: 'demo-doctor'
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        this.displayRadiologyResults(data);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('RAG Radiology Analysis Error:', error);
      resultsContainer.innerHTML = `
        <div class="error-state">
          <h3>❌ Analysis Error</h3>
          <p>${error.message}</p>
          <p class="error-detail">Please try again or contact support.</p>
        </div>
      `;
    }
  }

  displayRadiologyResults(data) {
    const resultsContainer = document.getElementById('radiologyResults');

    resultsContainer.innerHTML = `
      <div class="rag-results">
        <div class="results-header">
          <h2>🔬 RAG Radiology Analysis Report</h2>
          <div class="analysis-meta">
            <span class="meta-item"><strong>Analysis ID:</strong> ${data.analysisId}</span>
            <span class="meta-item"><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString('en-US')}</span>
            <span class="meta-item"><strong>AI Model:</strong> ${data.aiModel}</span>
          </div>
        </div>

        <!-- Urgency Badge -->
        <div class="urgency-section">
          <div class="urgency-badge urgency-${data.urgency.toLowerCase()}">
            <span class="urgency-icon">⚡</span>
            <span class="urgency-text">${data.urgency}</span>
            <span class="confidence-badge">${data.confidence}% Confidence</span>
          </div>
        </div>

        <!-- Primary Findings -->
        <div class="result-card">
          <h3>📋 Primary Findings</h3>
          <div class="findings-content">
            <pre>${data.primaryFindings}</pre>
          </div>
        </div>

        <!-- Enhanced Findings (RAG) -->
        <div class="result-card enhanced-card">
          <h3>🔍 RAG-Enhanced Findings</h3>
          <div class="findings-content">
            <pre>${data.enhancedFindings.findings}</pre>
          </div>
          <div class="rag-sources">
            <strong>Medical Literature Sources:</strong> ${data.enhancedFindings.ragSources.join(', ')}
          </div>
        </div>

        <!-- Missed Details -->
        ${data.missedDetails.length > 0 ? `
          <div class="result-card warning-card">
            <h3>⚠️ Potentially Missed Details</h3>
            <div class="missed-details-list">
              ${data.missedDetails.map(detail => `
                <div class="missed-detail-item">
                  <div class="detail-header">
                    <span class="detail-icon">🎯</span>
                    <strong>${detail.finding}</strong>
                  </div>
                  <div class="detail-body">
                    <p><strong>Disease:</strong> ${detail.disease}</p>
                    <p><strong>Significance:</strong> ${detail.significance}</p>
                    <p><strong>Action:</strong> ${detail.action}</p>
                    <p class="evidence"><strong>Evidence:</strong> ${detail.evidence}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Diagnostic Roadmap -->
        <div class="result-card roadmap-card">
          <h3>🗺️ Diagnostic Roadmap</h3>

          ${data.diagnosticRoadmap.immediate.length > 0 ? `
            <div class="roadmap-section immediate">
              <h4>🚨 Immediate Actions (Urgent)</h4>
              <ol>
                ${data.diagnosticRoadmap.immediate.map(step => `
                  <li>
                    <strong>${step.step}</strong>
                    <span class="timeframe">(${step.timeframe})</span>
                    ${step.reason ? `<p class="reason">${step.reason}</p>` : ''}
                  </li>
                `).join('')}
              </ol>
            </div>
          ` : ''}

          ${data.diagnosticRoadmap.shortTerm.length > 0 ? `
            <div class="roadmap-section short-term">
              <h4>📅 Short-Term Actions</h4>
              <ol>
                ${data.diagnosticRoadmap.shortTerm.map(step => `
                  <li>
                    <strong>${step.step}</strong>
                    <span class="timeframe">(${step.timeframe})</span>
                  </li>
                `).join('')}
              </ol>
            </div>
          ` : ''}

          ${data.diagnosticRoadmap.preventive.length > 0 ? `
            <div class="roadmap-section preventive">
              <h4>🛡️ Preventive Measures</h4>
              <ul>
                ${data.diagnosticRoadmap.preventive.map(step => `
                  <li>
                    ${step.step}
                    <span class="reason">${step.reason}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>

        <!-- Recommendations -->
        <div class="result-card">
          <h3>💡 Recommendations</h3>

          ${data.recommendations.imaging.length > 0 ? `
            <div class="rec-section">
              <h4>📸 Advanced Imaging</h4>
              <ul>
                ${data.recommendations.imaging.map(rec => `
                  <li>
                    <span class="rec-priority priority-${rec.priority.toLowerCase()}">${rec.priority}</span>
                    ${rec.test}
                    <span class="indication">(${rec.indication})</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          ${data.recommendations.laboratory.length > 0 ? `
            <div class="rec-section">
              <h4>🔬 Laboratory Tests</h4>
              <ul>
                ${data.recommendations.laboratory.map(rec => `
                  <li>${rec.test} <span class="indication">(${rec.indication})</span></li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          ${data.recommendations.referrals.length > 0 ? `
            <div class="rec-section">
              <h4>👨‍⚕️ Specialist Consultations</h4>
              <ul>
                ${data.recommendations.referrals.map(rec => `
                  <li>
                    <span class="rec-urgency urgency-${rec.urgency.toLowerCase()}">${rec.urgency}</span>
                    ${rec.specialty}
                    <span class="indication">(${rec.indication})</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>

        <div class="disclaimer-section">
          <p class="disclaimer">⚠️ ${data.disclaimer}</p>
          <p class="disclaimer">This report is generated by AI and must be reviewed by a qualified radiologist.</p>
        </div>
      </div>
    `;
  }

  loadPage(page) {
    console.log(`Loading page: ${page}`);
    // Implement other page loading logic
  }

  initAnimations() {
    // Smooth scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe menu items
    document.querySelectorAll('.menu-item').forEach(item => {
      observer.observe(item);
    });
  }
}

// Initialize premium menu
window.premiumMenu = new PremiumNestedMenu();

// Make runUSAAnalysis globally accessible
window.runUSAAnalysis = function() {
  window.premiumMenu.runUSAAnalysis();
};
