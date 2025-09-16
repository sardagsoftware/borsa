#!/usr/bin/env node

/**
 * 🧪 AI-LENS TRADER — Mobile-First Turbo Smoke Test (Simple)
 * Audit → Patch → Verify cycle implementation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TARGET_URL = 'https://borsa.ailydian.com';
const REPORT_DIR = '/tmp';

// Smoke test findings
const findings = {
  timestamp: new Date().toISOString(),
  url: TARGET_URL,
  tests: {
    build_status: 'unknown',
    bundle_analysis: {},
    mobile_ux: {},
    performance: {},
    accessibility: {},
    security: {}
  },
  recommendations: []
};

console.log('🚀 AI-LENS TRADER Mobile-First Turbo Smoke Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 1. Build Status Check
console.log('\n📦 Checking build status...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  findings.tests.build_status = 'success';
  console.log('✅ Build successful');
} catch (error) {
  findings.tests.build_status = 'failed';
  console.log('❌ Build failed');
  findings.recommendations.push('Fix build errors before optimization');
}

// 2. Bundle Analysis (Simple)
console.log('\n📊 Analyzing bundle...');
try {
  const buildDir = path.join(process.cwd(), '.next/static');
  if (fs.existsSync(buildDir)) {
    const stats = execSync('find .next/static -name "*.js" | head -10 | xargs ls -lah', { encoding: 'utf8' });
    console.log('Bundle files found:');
    console.log(stats);
    findings.tests.bundle_analysis.status = 'analyzed';
    findings.recommendations.push('Consider code splitting for large bundles');
  }
} catch (error) {
  console.log('⚠️  Bundle analysis skipped');
  findings.tests.bundle_analysis.status = 'skipped';
}

// 3. Mobile UX Assessment
console.log('\n📱 Mobile UX Assessment...');
const mobileIssues = [];

// Check for mobile-specific components
const componentsToCheck = [
  'components/layout/BottomDock.tsx',
  'components/ui/sheet.tsx',
  'components/mobile',
];

componentsToCheck.forEach(comp => {
  const filePath = path.join(process.cwd(), comp);
  if (fs.existsSync(filePath)) {
    console.log(`✅ Found: ${comp}`);
  } else {
    console.log(`❌ Missing: ${comp}`);
    mobileIssues.push(`Missing mobile component: ${comp}`);
  }
});

findings.tests.mobile_ux = {
  issues: mobileIssues,
  status: mobileIssues.length === 0 ? 'good' : 'needs_work'
};

// 4. Performance Quick Check
console.log('\n⚡ Performance Quick Check...');
const perfIssues = [];

// Check for next/image usage
try {
  const imageUsage = execSync('grep -r "next/image" app/ components/ || true', { encoding: 'utf8' });
  if (imageUsage.trim()) {
    console.log('✅ Using next/image');
  } else {
    console.log('❌ No next/image usage found');
    perfIssues.push('Implement next/image for image optimization');
  }
} catch (error) {
  console.log('⚠️  Image check skipped');
}

// Check for dynamic imports
try {
  const dynamicImports = execSync('grep -r "dynamic.*import" app/ components/ || true', { encoding: 'utf8' });
  if (dynamicImports.trim()) {
    console.log('✅ Using dynamic imports');
  } else {
    console.log('❌ No dynamic imports found');
    perfIssues.push('Implement dynamic imports for code splitting');
  }
} catch (error) {
  console.log('⚠️  Dynamic import check skipped');
}

findings.tests.performance = {
  issues: perfIssues,
  status: perfIssues.length === 0 ? 'good' : 'needs_optimization'
};

// 5. Security Headers Check
console.log('\n🔒 Security Assessment...');
const securityIssues = [];

try {
  const middlewareExists = fs.existsSync(path.join(process.cwd(), 'middleware.ts'));
  if (middlewareExists) {
    console.log('✅ Middleware exists');
    const middlewareContent = fs.readFileSync(path.join(process.cwd(), 'middleware.ts'), 'utf8');
    
    const securityHeaders = ['X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy'];
    securityHeaders.forEach(header => {
      if (middlewareContent.includes(header)) {
        console.log(`✅ ${header} configured`);
      } else {
        console.log(`❌ ${header} missing`);
        securityIssues.push(`Add ${header} security header`);
      }
    });
  } else {
    console.log('❌ No middleware found');
    securityIssues.push('Implement security middleware');
  }
} catch (error) {
  console.log('⚠️  Security check failed');
  securityIssues.push('Security assessment incomplete');
}

findings.tests.security = {
  issues: securityIssues,
  status: securityIssues.length === 0 ? 'secure' : 'needs_hardening'
};

// 6. Accessibility Quick Check
console.log('\n♿ Accessibility Quick Check...');
const a11yIssues = [];

// Check for basic a11y patterns
try {
  const buttonUsage = execSync('grep -r "aria-label\\|role=" app/ components/ || true', { encoding: 'utf8' });
  if (buttonUsage.trim()) {
    console.log('✅ Found ARIA usage');
  } else {
    console.log('❌ Limited ARIA usage');
    a11yIssues.push('Implement proper ARIA labels and roles');
  }
} catch (error) {
  console.log('⚠️  A11y check skipped');
}

findings.tests.accessibility = {
  issues: a11yIssues,
  status: a11yIssues.length === 0 ? 'good' : 'needs_improvement'
};

// Compile all recommendations
const allIssues = [
  ...mobileIssues,
  ...perfIssues,
  ...securityIssues,
  ...a11yIssues
];

findings.recommendations = findings.recommendations.concat(allIssues);

// 7. Generate Report
console.log('\n📄 Generating smoke test report...');

const reportPath = path.join(REPORT_DIR, 'borsa-smoke.json');
const findingsPath = path.join(REPORT_DIR, 'Findings.md');

fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2));

const markdownReport = `# AI-LENS TRADER Smoke Test Findings

## Test Summary
- **Date:** ${findings.timestamp}
- **URL:** ${findings.url}
- **Build Status:** ${findings.tests.build_status}

## Critical Issues Found: ${findings.recommendations.length}

### Mobile UX Status: ${findings.tests.mobile_ux.status}
${findings.tests.mobile_ux.issues.map(issue => `- ❌ ${issue}`).join('\n')}

### Performance Status: ${findings.tests.performance.status}
${findings.tests.performance.issues.map(issue => `- ⚡ ${issue}`).join('\n')}

### Security Status: ${findings.tests.security.status}
${findings.tests.security.issues.map(issue => `- 🔒 ${issue}`).join('\n')}

### Accessibility Status: ${findings.tests.accessibility.status}
${findings.tests.accessibility.issues.map(issue => `- ♿ ${issue}`).join('\n')}

## Priority Actions
${findings.recommendations.slice(0, 5).map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

## Next Steps
1. Implement mobile-first BottomDock component
2. Add performance optimizations (next/image, dynamic imports)
3. Enhance security headers
4. Improve accessibility patterns
5. Run full Lighthouse audit after patches

---
*Generated by AI-LENS TRADER Turbo Smoke Test*
`;

fs.writeFileSync(findingsPath, markdownReport);

console.log('\n✅ Smoke test complete!');
console.log(`📊 Report: ${reportPath}`);
console.log(`📋 Findings: ${findingsPath}`);
console.log(`\n🎯 Found ${findings.recommendations.length} optimization opportunities`);

// Output summary for next steps
if (findings.recommendations.length > 0) {
  console.log('\n🚀 Ready for TURBO PATCHES:');
  findings.recommendations.slice(0, 3).forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec}`);
  });
}

process.exit(0);
