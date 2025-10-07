/**
 * Test script for Healthcare Data Engineering Platform APIs
 * - FHIR Patient Search
 * - DICOM Study Search
 * - Genomics VCF Analysis
 * - IoT Device Telemetry
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3100/api/medical/health-data-engineering';

async function testFHIRPatientSearch() {
    console.log('\n🏥 Testing FHIR Patient Search API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/fhir-patient-search`, {
            patientID: 'patient-001'
        });

        console.log('✅ FHIR Patient Search Response:');
        console.log('   Success:', response.data.success);
        console.log('   Resource Type:', response.data.resourceType);
        console.log('   Total Patients:', response.data.total);

        if (response.data.entry && response.data.entry.length > 0) {
            const patient = response.data.entry[0].resource;
            console.log('\n   Patient Details:');
            console.log('   - ID:', patient.id);
            console.log('   - Name:', `${patient.name[0].given.join(' ')} ${patient.name[0].family}`);
            console.log('   - Gender:', patient.gender);
            console.log('   - Birth Date:', patient.birthDate);
            console.log('   - MRN:', patient.identifier[0].value);

            console.log('\n   Conditions:');
            patient.condition.forEach((cond, i) => {
                console.log(`   ${i + 1}. ${cond.display} (${cond.code}) - onset: ${cond.onsetDate}`);
            });

            console.log('\n   Medications:');
            patient.medications.forEach((med, i) => {
                console.log(`   ${i + 1}. ${med.name} - ${med.dosage}`);
            });
        }

    } catch (error) {
        console.error('❌ FHIR Patient Search Error:', error.response?.data || error.message);
    }
}

async function testDICOMStudySearch() {
    console.log('\n\n📊 Testing DICOM Study Search API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/dicom-study-search`, {
            patientID: 'patient-001',
            modality: 'CT'
        });

        console.log('✅ DICOM Study Search Response:');
        console.log('   Success:', response.data.success);
        console.log('   Total Studies:', response.data.totalStudies);
        console.log('   PACS Connection:', response.data.pacsConnection);
        console.log('   Storage Capacity:', response.data.storageCapacity);

        if (response.data.studies && response.data.studies.length > 0) {
            response.data.studies.forEach((study, i) => {
                console.log(`\n   Study ${i + 1}:`);
                console.log('   - Study UID:', study.studyInstanceUID);
                console.log('   - Study Date:', study.studyDate);
                console.log('   - Description:', study.studyDescription);
                console.log('   - Modality:', study.modalitiesInStudy.join(', '));
                console.log('   - Series:', study.numberOfSeries);
                console.log('   - Images:', study.numberOfInstances);
                console.log('   - Patient:', study.patientName);
                console.log('   - Accession Number:', study.accessionNumber);

                console.log('\n   Radiologist Report:');
                console.log('   - Date:', study.radiologistReport.reportDate);
                console.log('   - Radiologist:', study.radiologistReport.radiologist);
                console.log('   - Impression:', study.radiologistReport.impression);

                if (study.findings && study.findings.length > 0) {
                    console.log('\n   Findings:');
                    study.findings.forEach((finding, j) => {
                        console.log(`   ${j + 1}. ${finding.finding}`);
                        console.log(`      Location: ${finding.location}`);
                        console.log(`      Size: ${finding.size}`);
                        console.log(`      Recommendation: ${finding.recommendation}`);
                    });
                }
            });
        }

    } catch (error) {
        console.error('❌ DICOM Study Search Error:', error.response?.data || error.message);
    }
}

async function testGenomicsVCFAnalysis() {
    console.log('\n\n🧬 Testing Genomics VCF Analysis API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/genomics-vcf-analysis`, {
            patientID: 'patient-001'
        });

        console.log('✅ Genomics VCF Analysis Response:');
        console.log('   Success:', response.data.success);
        console.log('   Patient ID:', response.data.patientID);

        console.log('\n   File Info:');
        console.log('   - File Name:', response.data.fileInfo.fileName);
        console.log('   - File Size:', response.data.fileInfo.fileSize);
        console.log('   - Upload Date:', response.data.fileInfo.uploadDate);
        console.log('   - Reference Genome:', response.data.fileInfo.referenceGenome);
        console.log('   - Sequencing Platform:', response.data.fileInfo.sequencingPlatform);

        console.log('\n   Quality Metrics:');
        console.log('   - Total Reads:', response.data.qualityMetrics.totalReads.toLocaleString());
        console.log('   - Mapping Rate:', response.data.qualityMetrics.mappingRate);
        console.log('   - Mean Coverage:', response.data.qualityMetrics.meanCoverage + 'x');
        console.log('   - Coverage Uniformity:', response.data.qualityMetrics.coverageUniformity);

        console.log('\n   Variant Stats:');
        console.log('   - Total Variants:', response.data.variantStats.totalVariants.toLocaleString());
        console.log('   - SNPs:', response.data.variantStats.snps.toLocaleString());
        console.log('   - Indels:', response.data.variantStats.indels.toLocaleString());
        console.log('   - ClinVar Pathogenic:', response.data.variantStats.clinVarPathogenic);
        console.log('   - ClinVar Likely Pathogenic:', response.data.variantStats.clinVarLikelyPathogenic);

        if (response.data.clinicallyRelevantVariants && response.data.clinicallyRelevantVariants.length > 0) {
            console.log('\n   🚨 Clinically Relevant Variants:');
            response.data.clinicallyRelevantVariants.forEach((variant, i) => {
                console.log(`\n   ${i + 1}. ${variant.gene} - ${variant.variant}`);
                console.log(`      Chromosome: ${variant.chromosome}:${variant.position}`);
                console.log(`      Clinical Significance: ${variant.clinicalSignificance}`);
                console.log(`      ACMG Classification: ${variant.acmgClassification}`);
                console.log(`      Disease: ${variant.disease}`);
                console.log(`      Penetrance: ${variant.penetrance}`);
                console.log(`      Recommendation: ${variant.recommendation}`);
            });
        }

        if (response.data.pharmacogenomics && response.data.pharmacogenomics.length > 0) {
            console.log('\n   💊 Pharmacogenomics:');
            response.data.pharmacogenomics.forEach((pgx, i) => {
                console.log(`\n   ${i + 1}. ${pgx.gene} - ${pgx.genotype}`);
                console.log(`      Phenotype: ${pgx.phenotype}`);
                console.log(`      Affected Drugs: ${pgx.affectedDrugs.join(', ')}`);
                console.log(`      Recommendation: ${pgx.recommendation}`);
                console.log(`      CPIC Guideline: ${pgx.cpicGuideline}`);
            });
        }

        console.log('\n   Recommendation:', response.data.recommendation);

    } catch (error) {
        console.error('❌ Genomics VCF Analysis Error:', error.response?.data || error.message);
    }
}

async function testIoTDeviceTelemetry() {
    console.log('\n\n📱 Testing IoT Device Telemetry API...\n');

    try {
        const response = await axios.post(`${BASE_URL}/iot-device-telemetry`, {
            patientID: 'patient-001'
        });

        console.log('✅ IoT Device Telemetry Response:');
        console.log('   Success:', response.data.success);
        console.log('   Patient ID:', response.data.patientID);
        console.log('   Total Devices:', response.data.totalDevices);
        console.log('   Data Streaming Status:', response.data.dataStreamingStatus);
        console.log('   SignalR Connection:', response.data.signalRConnection);

        if (response.data.devices && response.data.devices.length > 0) {
            response.data.devices.forEach((device, i) => {
                console.log(`\n   Device ${i + 1}:`);
                console.log('   - Device ID:', device.deviceID);
                console.log('   - Device Type:', device.deviceType);
                console.log('   - Manufacturer:', device.manufacturer);
                console.log('   - Model:', device.model);
                console.log('   - Battery Level:', device.batteryLevel + '%');
                console.log('   - Signal Strength:', device.signalStrength);
                console.log('   - Last Sync:', device.lastSync);

                if (device.recentReadings && device.recentReadings.length > 0) {
                    console.log('\n   Recent Readings:');
                    device.recentReadings.slice(0, 3).forEach((reading, j) => {
                        if (reading.value !== undefined) {
                            console.log(`   ${j + 1}. ${reading.timestamp}: ${reading.value} ${reading.unit}${reading.trend ? ` (${reading.trend})` : ''}`);
                        } else if (reading.systolic !== undefined) {
                            console.log(`   ${j + 1}. ${reading.timestamp}: ${reading.systolic}/${reading.diastolic} ${reading.unit}, Pulse: ${reading.pulse} bpm`);
                        }
                    });
                }

                if (device.statistics) {
                    console.log('\n   Statistics:');
                    Object.entries(device.statistics).forEach(([key, value]) => {
                        console.log(`   - ${key}: ${value}`);
                    });
                }
            });
        }

        console.log('\n   Market Impact:');
        console.log('   - IoMT Market:', response.data.marketImpact.ioMTMarket);
        console.log('   - Remote Patient Monitoring:', response.data.marketImpact.remotePatientMonitoring);
        console.log('   - Cost Savings:', response.data.marketImpact.costSavings);

    } catch (error) {
        console.error('❌ IoT Device Telemetry Error:', error.response?.data || error.message);
    }
}

async function testDatabaseStats() {
    console.log('\n\n📊 Testing Database Stats API...\n');

    try {
        const response = await axios.get(`${BASE_URL}/database-stats`);

        console.log('✅ Database Stats Response:');
        console.log('   Success:', response.data.success);

        console.log('\n   FHIR Data Lake:');
        console.log('   - Total Patients:', response.data.fhirDataLake.totalPatients);
        console.log('   - FHIR Version:', response.data.fhirDataLake.fhirVersion);
        console.log('   - Azure Health Data Services:', response.data.fhirDataLake.azureHealthDataServices);
        console.log('   - Storage Capacity:', response.data.fhirDataLake.storageCapacity);
        console.log('   - Compliance:', response.data.fhirDataLake.compliance.join(', '));

        console.log('\n   DICOM Pipeline:');
        console.log('   - Total Studies:', response.data.dicomPipeline.totalStudies);
        console.log('   - Total Images:', response.data.dicomPipeline.totalImages);
        console.log('   - Ingestion Capacity:', response.data.dicomPipeline.ingestionCapacity);
        console.log('   - Storage Capacity:', response.data.dicomPipeline.storageCapacity);
        console.log('   - Modalities:', response.data.dicomPipeline.modalities.join(', '));

        console.log('\n   Genomics Processing:');
        console.log('   - Total VCF Files:', response.data.genomicsProcessing.totalVCFFiles);
        console.log('   - Total Variants:', response.data.genomicsProcessing.totalVariants.toLocaleString());
        console.log('   - Pathogenic Variants:', response.data.genomicsProcessing.pathogenicVariants);
        console.log('   - Reference Genomes:', response.data.genomicsProcessing.referenceGenomes.join(', '));

        console.log('\n   IoT Telemetry:');
        console.log('   - Total Devices:', response.data.iotTelemetry.totalDevices);
        console.log('   - Data Streaming Rate:', response.data.iotTelemetry.dataStreamingRate);
        console.log('   - Azure IoT Hub:', response.data.iotTelemetry.azureIoTHub);
        console.log('   - Pipeline Latency:', response.data.iotTelemetry.dataPipelineLatency);

        console.log('\n   Market Impact:');
        console.log('   - Healthcare Data Management:', response.data.marketImpact.healthcareDataManagement);
        console.log('   - Medical Imaging:', response.data.marketImpact.medicalImaging);
        console.log('   - IoMT:', response.data.marketImpact.ioMT);
        console.log('   - Genomic Data Market:', response.data.marketImpact.genomicDataMarket);
        console.log('   - Total Addressable Market:', response.data.marketImpact.totalAddressableMarket);

        console.log('\n   Clinical Impact:');
        Object.entries(response.data.marketImpact.clinicalImpact).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });

    } catch (error) {
        console.error('❌ Database Stats Error:', error.response?.data || error.message);
    }
}

// Run all tests
(async () => {
    console.log('='.repeat(80));
    console.log('🏥 HEALTHCARE DATA ENGINEERING PLATFORM - TEST SUITE');
    console.log('='.repeat(80));

    await testFHIRPatientSearch();
    await testDICOMStudySearch();
    await testGenomicsVCFAnalysis();
    await testIoTDeviceTelemetry();
    await testDatabaseStats();

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(80) + '\n');
})();
