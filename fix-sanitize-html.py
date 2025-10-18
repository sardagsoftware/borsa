import re

with open('/Users/sardag/Desktop/ailydian-ultra-pro/public/medical-expert.html', 'r') as f:
    content = f.read()

# Pattern: AilydianSanitizer.sanitizeHTML(` ... `;
# Replace `;  at the end with `);
# Use lookahead to ensure we only match multi-line template literals

# Find all occurrences of sanitizeHTML with multi-line template literals
pattern = r'(AilydianSanitizer\.sanitizeHTML\(`[^`]*?)(`;)(\s*\n\s*(?:result|display|if|} else))'

replacement = r'\1`);\3'

content_fixed = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

with open('/Users/sardag/Desktop/ailydian-ultra-pro/public/medical-expert.html', 'w') as f:
    f.write(content_fixed)

print("✅ Fixed all AilydianSanitizer.sanitizeHTML template literals")
