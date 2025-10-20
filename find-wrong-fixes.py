import re

with open('/Users/sardag/Desktop/ailydian-ultra-pro/public/medical-expert.html', 'r') as f:
    lines = f.readlines()

# Find all lines with `);
wrong_fixes = []
for i, line in enumerate(lines, 1):
    if re.search(r'^\s*`\);', line):
        # Check previous 50 lines for AilydianSanitizer.sanitizeHTML(
        has_sanitize = False
        for j in range(max(0, i-50), i):
            if 'AilydianSanitizer.sanitizeHTML(`' in lines[j]:
                has_sanitize = True
                break
        
        if not has_sanitize:
            # This is a wrong fix - should be `; not `);
            wrong_fixes.append(i)
            print(f"Line {i}: Should be `; not `); (no sanitizeHTML found in previous 50 lines)")

print(f"\n✅ Found {len(wrong_fixes)} wrong fixes that need to be reverted")

# Now fix them
for line_num in wrong_fixes:
    lines[line_num - 1] = lines[line_num - 1].replace('`);', '`;')

# Write back
with open('/Users/sardag/Desktop/ailydian-ultra-pro/public/medical-expert.html', 'w') as f:
    f.writelines(lines)

print(f"✅ Fixed {len(wrong_fixes)} lines")
