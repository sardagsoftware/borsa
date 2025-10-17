const fs = require('fs');
const path = require('path');

// Read the HTML file
const htmlPath = path.join(__dirname, 'public/lydian-iq.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

console.log('🔍 Validating lydian-iq.html for JavaScript syntax errors...\n');

// Extract all <script> tags
const scriptRegex = /<script(?:\s+[^>]*)?>[\s\S]*?<\/script>/gi;
const scripts = html.match(scriptRegex) || [];

console.log(`Found ${scripts.length} script tags\n`);

let foundErrors = false;

scripts.forEach((script, index) => {
    // Skip external scripts
    if (script.includes('src=')) {
        return;
    }

    // Extract script content
    const content = script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');

    if (!content.trim()) {
        return;
    }

    console.log(`\n--- Script ${index + 1} (${content.length} chars) ---`);

    // Try to parse the JavaScript
    try {
        // Use Function constructor to validate syntax
        new Function(content);
        console.log('✅ Valid JavaScript');
    } catch (error) {
        foundErrors = true;
        console.log('❌ SYNTAX ERROR:');
        console.log('   Message:', error.message);

        // Show preview of problematic area
        const lines = content.split('\n');
        const errorLine = parseInt(error.message.match(/line (\d+)/)?.[1] || '0');

        if (errorLine > 0) {
            const start = Math.max(0, errorLine - 3);
            const end = Math.min(lines.length, errorLine + 2);

            console.log('\n   Context:');
            for (let i = start; i < end; i++) {
                const prefix = i === errorLine - 1 ? '>>> ' : '    ';
                console.log(`${prefix}${i + 1}: ${lines[i].substring(0, 100)}`);
            }
        }
    }
});

// Also check for common patterns
console.log('\n\n🔍 Checking for common syntax issues...\n');

// Check for unclosed sanitizeHTML calls
const sanitizePattern = /AilydianSanitizer\.sanitizeHTML\s*\(`[^`]*`\s*;/g;
let match;
let unclosedCount = 0;

while ((match = sanitizePattern.exec(html)) !== null) {
    unclosedCount++;
    const lineNum = html.substring(0, match.index).split('\n').length;
    console.log(`⚠️  Line ${lineNum}: Potentially unclosed sanitizeHTML (ends with ';' instead of ');')`);
    console.log(`   Preview: ${match[0].substring(0, 80)}...`);
    foundErrors = true;
}

// Check for template literals with missing closing
const templatePattern = /`[^`]*$/gm;
const lines = html.split('\n');

lines.forEach((line, idx) => {
    // Count backticks
    const backticks = (line.match(/`/g) || []).length;
    if (backticks % 2 !== 0) {
        // Odd number of backticks might indicate unclosed template
        if (line.includes('sanitizeHTML') || line.includes('innerHTML')) {
            console.log(`⚠️  Line ${idx + 1}: Odd number of backticks (potential unclosed template)`);
            console.log(`   Preview: ${line.trim().substring(0, 100)}`);
        }
    }
});

console.log('\n' + '='.repeat(60));
if (foundErrors) {
    console.log('❌ VALIDATION FAILED: Syntax errors found');
    process.exit(1);
} else {
    console.log('✅ VALIDATION PASSED: No syntax errors found');
    process.exit(0);
}
