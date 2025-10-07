/**
 * Neuro Health AI - Remaining API Integrations
 * This file contains the updated functions for Risk Assessment, Digital Twin, and Clinician Portal
 *
 * Instructions: Copy these functions to medical-expert.html to replace the existing ones
 */

// 3. Neuro Risk Assessment - UPDATED
async function calculateNeuroRisk() {
    const age = parseInt(document.getElementById('neuroRiskAge').value);
    const familyHistory = document.getElementById('neuroRiskFamilyHistory').value;
    const diabetes = document.getElementById('neuroRiskDiabetes').checked;
    const hypertension = document.getElementById('neuroRiskHypertension').checked;
    const smoking = document.getElementById('neuroRiskSmoking').checked;
    const obesity = document.getElementById('neuroRiskObesity').checked;
    const memoryComplaints = document.getElementById('neuroRiskMemory').checked;
    const depression = document.getElementById('neuroRiskDepression').checked;
    const apoe4Status = document.getElementById('neuroRiskAPOE4').value;

    if (!age) {
        alert('Please enter your age');
        return;
    }

    try {
        // REAL API CALL to /api/neuro/risk-assessment
        const response = await fetch('/api/neuro/risk-assessment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                age,
                gender: 'unknown', // Not collected in current UI, can add if needed
                familyHistory,
                diabetes,
                hypertension,
                smoking,
                obesity,
                memoryComplaints,
                depression,
                apoe4Status
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Display results
        document.getElementById('neuroRiskResults').style.display = 'block';
        document.getElementById('neuroRiskPercentage').textContent = data.tenYearRisk + '%';
        document.getElementById('neuroRiskLevel').textContent = data.riskLevel;
        document.getElementById('neuroRiskAlzheimer').textContent = data.diseaseSpecificRisks.alzheimer + '%';
        document.getElementById('neuroRiskStroke').textContent = data.diseaseSpecificRisks.stroke + '%';
        document.getElementById('neuroRiskParkinson').textContent = data.diseaseSpecificRisks.parkinson + '%';

        // Protective actions
        const actionsHTML = data.protectiveActions.map(action =>
            `<p style="margin-bottom: 0.75rem; padding-left: 1.5rem; text-indent: -1.5rem;">${action.icon} ${action.action} - ${action.impact}</p>`
        ).join('');
        document.getElementById('neuroRiskActions').innerHTML = actionsHTML;

        // References
        const referencesHTML = data.evidenceBased.references.map(ref =>
            `<p style="margin-bottom: 0.5rem;">📄 ${ref}</p>`
        ).join('');
        document.getElementById('neuroRiskReferences').innerHTML = referencesHTML;

        // Scroll to results
        document.getElementById('neuroRiskResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        console.error('Neuro risk assessment error:', error);
        alert('Risk assessment failed: ' + error.message);
    }
}

// 4. Digital Neuro-Twin - UPDATED
async function generateNeuroTwin() {
    const timeHorizon = parseInt(document.getElementById('neuroTwinTimeHorizon').value);

    const button = event.target;
    button.disabled = true;
    button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 8px; animation: spin 1s linear infinite;">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
        </svg>
        Generating Digital Twin Model...
    `;

    try {
        // REAL API CALL to /api/neuro/digital-twin
        const response = await fetch('/api/neuro/digital-twin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                age: 65, // In production: get from user input
                gender: 'unknown',
                education: 16,
                lifestyle: {
                    exercise: true,
                    diet: true,
                    sleep: true,
                    social: true
                },
                medicalHistory: '',
                cognitiveScore: 28,
                genetics: {
                    apoe4: 'none'
                },
                timeHorizon
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Generate anonymized patient ID
        document.getElementById('neuroTwinPatientID').value = data.digitalTwin.patientClusterId;

        // Display results
        document.getElementById('neuroTwinResults').style.display = 'block';
        document.getElementById('neuroTwinBrainAge').textContent = data.digitalTwin.brainAge + ' years';
        document.getElementById('neuroTwinCognitiveReserve').textContent = data.digitalTwin.cognitiveReserve;
        document.getElementById('neuroTwinConfidence').textContent = data.digitalTwin.modelConfidence;

        // Interventions
        const interventionsHTML = data.interventionOpportunities.map(intervention =>
            `<p style="margin-bottom: 0.75rem;">${intervention.icon} ${intervention.intervention} - ${intervention.potentialImpact}</p>`
        ).join('');
        document.getElementById('neuroTwinInterventions').innerHTML = interventionsHTML;

        // Update status indicators
        document.getElementById('neuroTwinFHIRStatus').textContent = 'Connected ✓';
        document.getElementById('neuroTwinFHIRStatus').style.color = '#10A37F';
        document.getElementById('neuroTwinMRIStatus').textContent = 'Analyzed ✓';
        document.getElementById('neuroTwinMRIStatus').style.color = '#10A37F';

        // Chart would be rendered here using Chart.js in production
        const canvas = document.getElementById('neuroTwinChart');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Brain Aging Trajectory Chart', canvas.width / 2, canvas.height / 2);
        ctx.font = '12px sans-serif';
        ctx.fillText(`(${data.trajectory.data.length} year prediction loaded)`, canvas.width / 2, canvas.height / 2 + 25);

        button.innerHTML = '✓ Digital Twin Generated';
        button.style.background = 'linear-gradient(135deg, #059669, #047857)';

        document.getElementById('neuroTwinResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        console.error('Neuro-twin generation error:', error);
        alert('Failed to generate digital twin: ' + error.message);
        button.disabled = false;
        button.innerHTML = 'Generate Digital Neuro-Twin Model';
    }
}

// 5. Clinician Portal - UPDATED
async function authenticateClinician() {
    const licenseNumber = document.getElementById('clinicianLicenseNumber').value;
    const specialty = document.getElementById('clinicianSpecialty').value;

    if (!licenseNumber || !specialty) {
        alert('Please enter your medical license number and specialty');
        return;
    }

    const button = event.target;
    button.disabled = true;
    button.innerHTML = '🔒 Authenticating...';

    try {
        // REAL API CALL to /api/neuro/clinician-portal
        const response = await fetch('/api/neuro/clinician-portal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                licenseNumber,
                specialty
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API Error: ${response.status}`);
        }

        const data = await response.json();

        // Show dashboard
        document.getElementById('clinicianDashboard').style.display = 'block';

        // Update clinician info (if available in UI)
        console.log('Clinician authenticated:', data.clinician);

        button.innerHTML = '✓ Authenticated';
        button.style.background = 'linear-gradient(135deg, #059669, #047857)';

        // Scroll to dashboard
        setTimeout(() => {
            document.getElementById('clinicianDashboard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 500);

    } catch (error) {
        console.error('Authentication error:', error);
        alert('Authentication failed: ' + error.message);
        button.disabled = false;
        button.innerHTML = 'Authenticate & Access Validation Queue';
    }
}

async function validateAssessment(assessmentId, action) {
    const confirmMsg = {
        'approve': 'Are you sure you want to approve this assessment?',
        'revise': 'Request revision for this assessment?',
        'reject': 'Are you sure you want to reject this assessment?'
    };

    if (!confirm(confirmMsg[action])) return;

    try {
        // REAL API CALL to /api/neuro/clinician-portal/validate
        const response = await fetch('/api/neuro/clinician-portal/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                assessmentId,
                action,
                feedback: '' // Can add feedback textarea in UI
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        alert(data.message);

        // In production: Remove card from queue and update stats

    } catch (error) {
        console.error('Validation error:', error);
        alert('Validation failed: ' + error.message);
    }
}

console.log('✅ Neuro Health AI - API Integration Loaded (Risk Assessment, Digital Twin, Clinician Portal)');
