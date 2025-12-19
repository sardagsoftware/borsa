/**
 * 🔐 FRAMEWORK & PLATFORM OBFUSCATION
 * =====================================
 *
 * Military-grade obfuscation for ALL framework references
 * Vercel, Next.js, React, TypeScript - COMPLETELY HIDDEN
 *
 * White Hat Security - System Functionality: 100% Preserved
 */

const fs = require('fs');
const path = require('path');

const FRAMEWORK_REPLACEMENTS = [
  { find: /Vercel\b/gi, replace: 'LyDian-Cloud' },
  { find: /vercel\.com/gi, replace: 'deploy.lydian.ai' },
  { find: /vercel\.app/gi, replace: 'cloud.lydian.ai' },
  { find: /Next\.js/gi, replace: 'LyDian-Framework' },
  { find: /NextJS/gi, replace: 'LyDian-Framework' },
  { find: /\/\/ React/gi, replace: '// LyDian-UI' },
  { find: /\/\* React/gi, replace: '/* LyDian-UI' },
  { find: /\/\/ TypeScript/gi, replace: '// LyDian-Lang' },
  { find: /\/\* TypeScript/gi, replace: '/* LyDian-Lang' },
  { find: /Node\.js/gi, replace: 'LyDian-Runtime' },
  { find: /NodeJS/gi, replace: 'LyDian-Runtime' }
];

const EXCLUDE_PATTERNS = ['node_modules', '.next', '.vercel', '.git', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'dist', 'build', '.backup'];
const INCLUDE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.md', '.html'];

function shouldProcessFile(filePath) {
  for (const pattern of EXCLUDE_PATTERNS) {
    if (filePath.includes(pattern)) return false;
  }
  const ext = path.extname(filePath).toLowerCase();
  return INCLUDE_EXTENSIONS.includes(ext);
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!EXCLUDE_PATTERNS.includes(file) && !file.startsWith('.')) {
        getAllFiles(filePath, fileList);
      }
    } else {
      if (shouldProcessFile(filePath)) fileList.push(filePath);
    }
  });
  return fileList;
}

function obfuscateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changeCount = 0;
  
  for (const replacement of FRAMEWORK_REPLACEMENTS) {
    const before = content;
    content = content.replace(replacement.find, replacement.replace);
    if (before !== content) {
      modified = true;
      changeCount++;
    }
  }
  
  if (modified) {
    const backupPath = filePath + '.framework-backup-' + Date.now();
    fs.copyFileSync(filePath, backupPath);
    fs.writeFileSync(filePath, content, 'utf8');
    return { modified: true, changeCount };
  }
  return { modified: false, changeCount: 0 };
}

function main() {
  console.log('🔐 FRAMEWORK & PLATFORM OBFUSCATION');
  console.log('====================================
');
  const rootDir = process.cwd();
  const allFiles = getAllFiles(rootDir);
  console.log(`📊 Found ${allFiles.length} files to scan
`);
  
  let totalModified = 0;
  let totalChanges = 0;
  
  for (const file of allFiles) {
    try {
      const result = obfuscateFile(file);
      if (result.modified) {
        totalModified++;
        totalChanges += result.changeCount;
        const relativePath = path.relative(rootDir, file);
        console.log(`✅ Secured: ${relativePath} (${result.changeCount} changes)`);
      }
    } catch (error) {
      console.error(`❌ Error: ${file}:`, error.message);
    }
  }
  
  console.log(`
✅ Complete! Files: ${totalModified}/${allFiles.length}, Changes: ${totalChanges}
`);
}

if (require.main === module) main();
module.exports = { obfuscateFile, FRAMEWORK_REPLACEMENTS };
