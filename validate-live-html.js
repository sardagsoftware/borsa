const fs = require('fs');

// Read the downloaded HTML
const html = fs.readFileSync('/tmp/lydian-iq-live.html', 'utf-8');

console.log('🔍 Extracting and validating inline JavaScript from live HTML...\n');

// Extract script content between <script> tags (not src=)
const scriptRegex = /<script(?:\s+[^>]*)?>[\s\S]*?<\/script>/gi;
const scripts = [];
let match;

while ((match = scriptRegex.exec(html)) !== null) {
    const fullTag = match[0];

    // Skip external scripts
    if (fullTag.includes('src=')) {
        continue;
    }

    // Extract content
    const content = fullTag
        .replace(/<script[^>]*>/, '')
        .replace(/<\/script>/, '')
        .trim();

    if (content) {
        const lineNumber = html.substring(0, match.index).split('\n').length;
        scripts.push({ content, lineNumber, length: content.length });
    }
}

console.log(`Found ${scripts.length} inline script blocks\n`);

let hasErrors = false;

scripts.forEach((script, index) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Script ${index + 1} starting at line ~${script.lineNumber}`);
    console.log(`Length: ${script.length} characters`);
    console.log('='.repeat(80));

    // Try to parse
    try {
        new Function(script.content);
        console.log('✅ Valid JavaScript syntax');
    } catch (error) {
        hasErrors = true;
        console.log('\n❌ SYNTAX ERROR FOUND!');
        console.log('Error message:', error.message);

        // Extract line number from error if available
        const errorLineMatch = error.message.match(/line (\d+)/);
        if (errorLineMatch) {
            const errorLine = parseInt(errorLineMatch[1]);
            const lines = script.content.split('\n');

            console.log('\n📍 Error Context:');
            const start = Math.max(0, errorLine - 5);
            const end = Math.min(lines.length, errorLine + 3);

            for (let i = start; i < end; i++) {
                const prefix = i === errorLine - 1 ? '>>> ' : '    ';
                const lineNum = script.lineNumber + i;
                console.log(`${prefix}Line ${lineNum}: ${lines[i].substring(0, 120)}`);
            }
        }

        // Show first 500 chars of problematic script
        console.log('\n📝 Script Preview (first 500 chars):');
        console.log(script.content.substring(0, 500));
        console.log('...');
    }
});

console.log('\n' + '='.repeat(80));
if (hasErrors) {
    console.log('❌ VALIDATION FAILED - Syntax errors detected');
    process.exit(1);
} else {
    console.log('✅ ALL SCRIPTS VALID');
    process.exit(0);
}
