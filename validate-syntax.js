const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/Users/sardag/Desktop/ailydian-ultra-pro/public/medical-expert.html', 'utf8');

// Extract all <script> blocks
const scriptMatches = html.match(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi) || [];

scriptMatches.forEach((script, index) => {
  const jsCode = script.replace(/<\/?script(?:\s+[^>]*)?>/gi, '');

  if (jsCode.trim() && !script.includes('src=')) { // Skip inline scripts with external src
    try {
      new vm.Script(jsCode);
      console.log(`✅ Script block ${index + 1}: Valid`);
    } catch (error) {
      console.log(`\n❌ Script block ${index + 1}: SYNTAX ERROR`);
      console.log(`Error: ${error.message}`);
      console.log(`Line: ${error.stack.split('\n')[0]}`);

      // Show context around error
      const lines = jsCode.split('\n');
      const errorMatch = error.stack.match(/:(\d+):(\d+)/);
      if (errorMatch) {
        const lineNum = parseInt(errorMatch[1]);
        const start = Math.max(0, lineNum - 3);
        const end = Math.min(lines.length, lineNum + 2);
        console.log('\nContext:');
        for (let i = start; i < end; i++) {
          const marker = i === lineNum - 1 ? '>>> ' : '    ';
          console.log(`${marker}${i + 1}: ${lines[i]}`);
        }
      }
    }
  }
});
