/**
 * Test script for Genomics & Precision Medicine Platform APIs
 * - Variant Interpretation (BRCA1, BRCA2, Factor V Leiden, HFE, APOE)
 * - Pharmacogenomics (CYP2D6, CYP2C19, TPMT, VKORC1)
 * - Inherited Disease Risk (Lynch Syndrome, Familial Hypercholesterolemia)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3100/api/medical/genomics';

async function testVariantInterpretation() {
  console.log('\n🧬 Testing Variant Interpretation API...\n');

  try {
    const response = await axios.post(`${BASE_URL}/variant-interpretation`, {
      gene: 'BRCA1',
      variant: 'c.68_69delAG',
      patientAge: 35,
      patientSex: 'female',
      familyHistory: 'positive'
    });

    console.log('✅ Variant Interpretation Response:');
    console.log('   Success:', response.data.success);
    console.log('\n   Variant Details:');
    console.log('   - Gene:', response.data.variant.gene);
    console.log('   - Variant:', response.data.variant.variant);
    console.log('   - Type:', response.data.variant.type);
    console.log('   - Clinical Significance:', response.data.variant.clinicalSignificance);
    console.log('   - ACMG Classification:', response.data.variant.acmgClassification);
    console.log('   - rsID:', response.data.variant.rsID);
    console.log('   - Allele Frequency:', response.data.variant.alleleFrequency);

    console.log('\n   Disease:');
    console.log('   - Name:', response.data.disease.name);
    console.log('   - Inheritance:', response.data.disease.inheritance);
    console.log('   - Penetrance:', response.data.disease.penetrance);

    console.log('\n   Personalized Risk:');
    console.log('   - Breast Cancer:', response.data.personalizedRisk.breastCancer);
    console.log('   - Ovarian Cancer:', response.data.personalizedRisk.ovarianCancer);
    console.log('   - Age of Onset:', response.data.personalizedRisk.ageOfOnset);

    console.log('\n   Evidence (ACMG Criteria):');
    response.data.evidence.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e}`);
    });

    console.log('\n   Clinical Recommendations:');
    response.data.recommendations.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r}`);
    });

    console.log('\n   Interpretation:');
    console.log('   - Summary:', response.data.interpretation.summary);
    console.log('   - Actionable:', response.data.interpretation.actionable);
    console.log('   - Urgency:', response.data.interpretation.urgency);

  } catch (error) {
    console.error('❌ Variant Interpretation Error:', error.response?.data || error.message);
  }
}

async function testPharmacogenomics() {
  console.log('\n\n💊 Testing Pharmacogenomics API...\n');

  try {
    const response = await axios.post(`${BASE_URL}/pharmacogenomics`, {
      gene: 'CYP2D6',
      phenotype: 'Poor Metabolizer (PM)',
      medications: ['Codeine', 'Tramadol', 'Metoprolol']
    });

    console.log('✅ Pharmacogenomics Response:');
    console.log('   Success:', response.data.success);
    console.log('\n   Gene Details:');
    console.log('   - Gene:', response.data.gene.name);
    console.log('   - Chromosome:', response.data.gene.chromosome);
    console.log('   - Function:', response.data.gene.function);
    console.log('   - Substrates:', response.data.gene.substrates.join(', '));

    console.log('\n   Patient Phenotype:', response.data.patientPhenotype);
    console.log('   - Frequency:', response.data.phenotypeData.frequency);
    console.log('   - Genotype:', response.data.phenotypeData.genotype);
    console.log('   - Clinical Impact:', response.data.phenotypeData.clinicalImpact);

    console.log('\n   Affected Medications:');
    response.data.affectedMedications.forEach((med, i) => {
      console.log(`\n   ${i + 1}. ${med.medication}:`);
      console.log(`      Recommendation: ${med.recommendation}`);
    });

    console.log('\n   FDA Labels:', response.data.fdaLabels.join(', '));
    console.log('\n   Clinical Actionability:');
    console.log('   - Level:', response.data.clinicalActionability.level);
    console.log('   - Action:', response.data.clinicalActionability.action);

    console.log('\n   CPIC Guideline:', response.data.cpicGuideline);

  } catch (error) {
    console.error('❌ Pharmacogenomics Error:', error.response?.data || error.message);
  }
}

async function testDiseaseRisk() {
  console.log('\n\n🩺 Testing Inherited Disease Risk API...\n');

  try {
    const response = await axios.post(`${BASE_URL}/disease-risk`, {
      disease: 'Lynch Syndrome',
      patientAge: 45,
      familyHistory: {
        firstDegree: 2,
        earlyOnset: true
      }
    });

    console.log('✅ Disease Risk Assessment Response:');
    console.log('   Success:', response.data.success);
    console.log('   Disease:', response.data.disease);
    console.log('   Genes:', response.data.genes.join(', '));
    console.log('   Inheritance:', response.data.inheritance);
    console.log('   Prevalence:', response.data.prevalence);

    console.log('\n   Lifetime Cancer Risks:');
    Object.entries(response.data.lifetimeRisks).forEach(([cancer, risk]) => {
      console.log(`   - ${cancer}: ${risk}`);
    });

    console.log('\n   Family History Strength:', response.data.familyHistoryStrength);

    console.log('\n   Screening Recommendations:');
    response.data.screening.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s}`);
    });

    console.log('\n   Genetic Testing:');
    console.log('   - Recommended:', response.data.geneticTesting.recommended);
    console.log('   - Genes:', response.data.geneticTesting.genes.join(', '));
    console.log('   - Methodology:', response.data.geneticTesting.methodology);

  } catch (error) {
    console.error('❌ Disease Risk Error:', error.response?.data || error.message);
  }
}

async function testDatabaseStats() {
  console.log('\n\n📊 Testing Database Stats API...\n');

  try {
    const response = await axios.get(`${BASE_URL}/database-stats`);

    console.log('✅ Database Stats Response:');
    console.log('   Success:', response.data.success);

    console.log('\n   External Databases:');
    console.log('   - ClinVar:');
    console.log('     • Variants:', response.data.databases.clinVar.variants);
    console.log('     • Pathogenic:', response.data.databases.clinVar.pathogenic);
    console.log('   - dbSNP:', response.data.databases.dbSNP.snps, 'SNPs');
    console.log('   - gnomAD:');
    console.log('     • Exomes:', response.data.databases.gnomAD.exomes);
    console.log('     • Genomes:', response.data.databases.gnomAD.genomes);
    console.log('     • Variants:', response.data.databases.gnomAD.variants);
    console.log('   - PharmGKB:', response.data.databases.pharmGKB.drugGenePairs, 'drug-gene pairs');
    console.log('   - OMIM:', response.data.databases.omim.entries, 'entries');

    console.log('\n   Local Database:');
    console.log('   - Curated Variants:', response.data.localDatabase.curatedVariants);
    console.log('   - Pharmacogenomics Genes:', response.data.localDatabase.pharmacogenomicsGenes);
    console.log('   - Disease Risk Profiles:', response.data.localDatabase.diseaseRiskProfiles);

    console.log('\n   Market Impact:');
    console.log('   - Precision Medicine Market:', response.data.marketImpact.precisionMedicineMarket);
    console.log('   - CAGR:', response.data.marketImpact.cagr);
    console.log('   - Genomic Testing Market:', response.data.marketImpact.genomicTestingMarket);
    console.log('   - Pharmacogenomics Testing:', response.data.marketImpact.pharmacogenomicsTesting);
    console.log('   - Cost Savings:', response.data.marketImpact.costSavings);
    console.log('   - Clinical Impact:', response.data.marketImpact.clinicalImpact);

  } catch (error) {
    console.error('❌ Database Stats Error:', error.response?.data || error.message);
  }
}

// Run all tests
(async () => {
  console.log('='.repeat(80));
  console.log('🧬 GENOMICS & PRECISION MEDICINE PLATFORM - TEST SUITE');
  console.log('='.repeat(80));

  await testVariantInterpretation();
  await testPharmacogenomics();
  await testDiseaseRisk();
  await testDatabaseStats();

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL TESTS COMPLETED');
  console.log('='.repeat(80) + '\n');
})();
