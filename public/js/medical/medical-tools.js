/**
 * LyDian Medical AI - Medical Tools & Calculators Module
 * Clinical calculators and medical tool functions
 */

const MedicalTools = {
    // ============================================
    // CARDIOLOGY CALCULATORS
    // ============================================
    async calculateFraminghamRisk(data) {
        try {
            MedicalUI.showLoading('framinghamResults', 'Calculating cardiovascular risk...');
            const result = await MedicalAPI.calculateFraminghamRisk(data);

            const resultsContainer = document.getElementById('framinghamResults');
            if (result.success) {
                resultsContainer.innerHTML = `
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #E5E7EB;">
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: #1F2937; margin-bottom: 1rem;">10-Year CVD Risk Assessment</h3>
                        <div style="background: linear-gradient(135deg, #DBEAFE, #BFDBFE); padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem;">
                            <p style="font-size: 2.5rem; font-weight: 800; color: #1E40AF; text-align: center;">${result.tenYearRisk}%</p>
                            <p style="text-align: center; color: #1E3A8A; font-weight: 600; margin-top: 0.5rem;">Risk Level: ${result.riskCategory}</p>
                        </div>
                        <div style="margin-top: 1rem;">
                            <h4 style="font-size: 0.875rem; font-weight: 600; color: #0066CC; margin-bottom: 0.75rem;">Recommendations</h4>
                            <ul style="list-style: none; padding: 0;">
                                ${result.recommendations.map(rec => `<li style="padding: 0.5rem; margin-bottom: 0.5rem; background: #F9FAFB; border-radius: 6px;">• ${rec}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            } else {
                MedicalUI.showError('framinghamResults', result.error || 'Calculation failed');
            }
        } catch (error) {
            MedicalUI.showError('framinghamResults', error.message);
        }
    },

    async calculateCHADS2Score(data) {
        try {
            MedicalUI.showLoading('chads2Results', 'Calculating CHADS2-VASc score...');
            const result = await MedicalAPI.calculateCHADS2Score(data);

            const resultsContainer = document.getElementById('chads2Results');
            if (result.success) {
                resultsContainer.innerHTML = `
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #E5E7EB;">
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: #1F2937; margin-bottom: 1rem;">CHADS2-VASc Score</h3>
                        <div style="background: linear-gradient(135deg, #FEF3C7, #FDE68A); padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem;">
                            <p style="font-size: 2.5rem; font-weight: 800; color: #92400E; text-align: center;">${result.score} Points</p>
                            <p style="text-align: center; color: #78350F; font-weight: 600; margin-top: 0.5rem;">Annual Stroke Risk: ${result.annualStrokeRisk}</p>
                        </div>
                        <div style="margin-top: 1rem;">
                            <h4 style="font-size: 0.875rem; font-weight: 600; color: #F59E0B; margin-bottom: 0.75rem;">Anticoagulation Recommendation</h4>
                            <p style="padding: 1rem; background: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 6px;">${result.recommendation}</p>
                        </div>
                    </div>
                `;
            } else {
                MedicalUI.showError('chads2Results', result.error || 'Calculation failed');
            }
        } catch (error) {
            MedicalUI.showError('chads2Results', error.message);
        }
    },

    // ============================================
    // NEUROLOGY TOOLS
    // ============================================
    async analyzeNeuroImaging(imageFile, modality, analysisType) {
        try {
            const button = event.target;
            button.disabled = true;
            button.innerHTML = '⏳ Analyzing...';

            const result = await MedicalAPI.analyzeNeuroImaging(imageFile, modality, analysisType);

            const resultsContainer = document.getElementById('neuroImagingResults');
            if (result.success) {
                resultsContainer.innerHTML = `
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #E5E7EB;">
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: #1F2937; margin-bottom: 1rem;">Brain Imaging Analysis</h3>
                        <div style="background: #F9FAFB; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <p style="font-size: 0.875rem; color: #374151; line-height: 1.6;">${result.analysis}</p>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                            <div style="text-align: center; padding: 1rem; background: #DBEAFE; border-radius: 8px;">
                                <p style="font-size: 0.75rem; color: #1E3A8A;">Confidence</p>
                                <p style="font-size: 1.5rem; font-weight: 700; color: #1E40AF;">${result.metrics.confidence}</p>
                            </div>
                            <div style="text-align: center; padding: 1rem; background: #D1FAE5; border-radius: 8px;">
                                <p style="font-size: 0.75rem; color: #065F46;">Volume</p>
                                <p style="font-size: 1.5rem; font-weight: 700; color: #047857;">${result.metrics.volume}</p>
                            </div>
                            <div style="text-align: center; padding: 1rem; background: #FEF3C7; border-radius: 8px;">
                                <p style="font-size: 0.75rem; color: #92400E;">Findings</p>
                                <p style="font-size: 1.5rem; font-weight: 700; color: #D97706;">${result.metrics.findings}</p>
                            </div>
                        </div>
                    </div>
                `;
                resultsContainer.style.display = 'block';
                button.innerHTML = '✓ Analysis Complete';
                button.style.background = '#10B981';
            }
        } catch (error) {
            MedicalUI.showError('neuroImagingResults', error.message);
            button.disabled = false;
            button.innerHTML = 'Analyze with AI Vision';
        }
    },

    // ============================================
    // GENOMICS TOOLS
    // ============================================
    async interpretVariant(data) {
        try {
            MedicalUI.showLoading('variantResults', 'Interpreting genetic variant...');
            const result = await MedicalAPI.interpretVariant(data);

            const resultsContainer = document.getElementById('variantResults');
            if (result.success) {
                resultsContainer.innerHTML = `
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #E5E7EB;">
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: #1F2937; margin-bottom: 1rem;">Variant Interpretation</h3>
                        <div style="background: linear-gradient(135deg, #DDD6FE, #C4B5FD); padding: 1.25rem; border-radius: 10px; margin-bottom: 1rem;">
                            <h4 style="font-size: 1rem; font-weight: 700; color: #5B21B6; margin-bottom: 0.5rem;">${result.variant.gene} ${result.variant.hgvs}</h4>
                            <p style="color: #6B21A8; font-weight: 600;">Classification: ${result.classification.acmg}</p>
                            <p style="color: #7C3AED; font-size: 0.875rem; margin-top: 0.5rem;">${result.classification.interpretation}</p>
                        </div>
                        <div style="margin-top: 1rem;">
                            <h4 style="font-size: 0.875rem; font-weight: 600; color: #8B5CF6; margin-bottom: 0.75rem;">Clinical Recommendations</h4>
                            <ul style="list-style: none; padding: 0;">
                                ${result.recommendations.map(rec => `<li style="padding: 0.5rem; margin-bottom: 0.5rem; background: #F5F3FF; border-radius: 6px; border-left: 3px solid #8B5CF6;">• ${rec}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;
                resultsContainer.style.display = 'block';
            }
        } catch (error) {
            MedicalUI.showError('variantResults', error.message);
        }
    },

    async analyzePharmacogenomics(data) {
        try {
            MedicalUI.showLoading('pharmacogenomicsResults', 'Analyzing drug-gene interactions...');
            const result = await MedicalAPI.analyzePharmacogenomics(data);

            const resultsContainer = document.getElementById('pharmacogenomicsResults');
            if (result.success) {
                resultsContainer.innerHTML = `
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #E5E7EB;">
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: #1F2937; margin-bottom: 1rem;">Pharmacogenomics Report</h3>
                        <div style="background: linear-gradient(135deg, #D1FAE5, #A7F3D0); padding: 1.25rem; border-radius: 10px; margin-bottom: 1rem;">
                            <h4 style="font-size: 1rem; font-weight: 700; color: #065F46;">${result.gene} - ${result.phenotype}</h4>
                            <p style="color: #047857; margin-top: 0.5rem;">${result.interpretation}</p>
                        </div>
                        <div style="margin-top: 1rem;">
                            <h4 style="font-size: 0.875rem; font-weight: 600; color: #10B981; margin-bottom: 0.75rem;">Drug Dosing Recommendations</h4>
                            ${result.drugRecommendations.map(drug => `
                                <div style="padding: 1rem; background: #F0FDF4; border-radius: 8px; margin-bottom: 0.75rem; border-left: 4px solid #10B981;">
                                    <p style="font-weight: 600; color: #065F46;">${drug.drug}</p>
                                    <p style="font-size: 0.875rem; color: #047857; margin-top: 0.25rem;">${drug.recommendation}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                resultsContainer.style.display = 'block';
            }
        } catch (error) {
            MedicalUI.showError('pharmacogenomicsResults', error.message);
        }
    },

    // ============================================
    // CLINICAL DECISION SUPPORT
    // ============================================
    async getDifferentialDiagnosis(data) {
        try {
            MedicalUI.showLoading('differentialResults', 'Analyzing symptoms with UpToDate + NICE guidelines...');
            const result = await MedicalAPI.getDifferentialDiagnosis(data);

            const resultsContainer = document.getElementById('differentialResults');
            if (result.success) {
                resultsContainer.innerHTML = `
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #E5E7EB;">
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: #1F2937; margin-bottom: 1rem;">🎯 Top Diagnosis</h3>
                        <div style="background: linear-gradient(135deg, #DBEAFE, #BFDBFE); padding: 1.25rem; border-radius: 10px; border-left: 4px solid #0066CC; margin-bottom: 1.5rem;">
                            <h4 style="font-size: 1rem; font-weight: 700; color: #1E40AF; margin-bottom: 0.5rem;">${result.topDiagnosis.condition}</h4>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem;">
                                <div><p style="font-size: 0.75rem; color: #1E3A8A; font-weight: 500;">Probability</p><p style="font-size: 1.125rem; font-weight: 700; color: #1E40AF;">${result.topDiagnosis.probability}</p></div>
                                <div><p style="font-size: 0.75rem; color: #1E3A8A; font-weight: 500;">ICD-10</p><p style="font-size: 1.125rem; font-weight: 700; color: #1E40AF;">${result.topDiagnosis.icd10}</p></div>
                                <div><p style="font-size: 0.75rem; color: #1E3A8A; font-weight: 500;">Urgency</p><p style="font-size: 1.125rem; font-weight: 700; color: #DC2626;">${result.topDiagnosis.urgency}</p></div>
                            </div>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <h4 style="font-size: 0.875rem; font-weight: 600; color: #EF4444; margin-bottom: 0.75rem;">🚩 Red Flags</h4>
                            <ul style="margin: 0; padding-left: 1.5rem; color: #374151; font-size: 0.875rem; line-height: 1.8;">
                                ${result.topDiagnosis.redFlags.map(flag => `<li>${flag}</li>`).join('')}
                            </ul>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <h4 style="font-size: 0.875rem; font-weight: 600; color: #0066CC; margin-bottom: 0.75rem;">📋 Next Steps</h4>
                            <ol style="margin: 0; padding-left: 1.5rem; color: #374151; font-size: 0.875rem; line-height: 1.8;">
                                ${result.topDiagnosis.nextSteps.map(step => `<li>${step}</li>`).join('')}
                            </ol>
                        </div>
                        <div style="background: #FEF3C7; padding: 1rem; border-radius: 8px; border-left: 4px solid #F59E0B;">
                            <p style="font-size: 0.875rem; color: #92400E; line-height: 1.6;"><strong>💡 Clinical Pearl:</strong> ${result.clinicalPearl}</p>
                        </div>
                    </div>
                `;
                resultsContainer.style.display = 'block';
            }
        } catch (error) {
            MedicalUI.showError('differentialResults', error.message);
        }
    },

    async checkDrugInteractions(medications) {
        try {
            MedicalUI.showLoading('interactionResults', 'Checking drug interactions...');
            const result = await MedicalAPI.checkDrugInteractions(medications);

            const resultsContainer = document.getElementById('interactionResults');
            if (result.success) {
                resultsContainer.innerHTML = `
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #E5E7EB;">
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: #1F2937; margin-bottom: 1rem;">Drug Interaction Analysis</h3>
                        ${result.interactions.length > 0 ? `
                            ${result.interactions.map(interaction => `
                                <div style="padding: 1rem; background: ${interaction.severity === 'High' ? '#FEE2E2' : '#FEF3C7'}; border-left: 4px solid ${interaction.severity === 'High' ? '#EF4444' : '#F59E0B'}; border-radius: 8px; margin-bottom: 1rem;">
                                    <p style="font-weight: 600; color: ${interaction.severity === 'High' ? '#7F1D1D' : '#92400E'};">⚠️ ${interaction.severity} Interaction</p>
                                    <p style="font-size: 0.875rem; color: ${interaction.severity === 'High' ? '#991B1B' : '#78350F'}; margin-top: 0.5rem;">${interaction.drugs.join(' + ')}</p>
                                    <p style="font-size: 0.875rem; color: ${interaction.severity === 'High' ? '#7F1D1D' : '#92400E'}; margin-top: 0.5rem;">${interaction.effect}</p>
                                    <p style="font-size: 0.875rem; font-weight: 600; color: ${interaction.severity === 'High' ? '#991B1B' : '#78350F'}; margin-top: 0.5rem;">Management: ${interaction.management}</p>
                                </div>
                            `).join('')}
                        ` : `
                            <div style="background: #D1FAE5; padding: 1rem; border-radius: 8px; border-left: 4px solid #10B981;">
                                <p style="color: #065F46; font-weight: 600;">✓ No significant interactions found</p>
                                <p style="font-size: 0.875rem; color: #047857; margin-top: 0.5rem;">The medications reviewed do not show major drug-drug interactions.</p>
                            </div>
                        `}
                    </div>
                `;
                resultsContainer.style.display = 'block';
            }
        } catch (error) {
            MedicalUI.showError('interactionResults', error.message);
        }
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.MedicalTools = MedicalTools;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MedicalTools;
}
